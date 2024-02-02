"""
下流追跡及び延床面積の集計:
　選択された管渠に対して、設定ファイルの内容および手動入力値をもとに下流追跡処理及び延床面積の集計処理を実施する。

"""

import arcpy
from Utils import SewerHeatGISUtil


def sequentialcal_calculate_teikayuka(
    ini_file_path, u_nobeyuka1, u_nobeyuka2, u_nobeyuka3, u_nobeyuka4
):
    """管渠レイヤの下流追跡を繰り返し実行し、管渠フィーチャーに接続する建物の延床面積を集計した値を上流管渠の逓加延床面積に加算していく。"""

    util = SewerHeatGISUtil()

    # ini形式の「延床面積集計設定ファイル」を読み込む
    settings = util.read_ini_settings(ini_file_path, "延床面積集計設定")

    # パラメータ
    MAX_FEATURE_COUNT = 100000  # 下流追跡処理の最大実行回数
    building_fc = settings["建物レイヤ名"]  # BUILDING_LOD0
    building_kankyokey = "KankyoKey"  # KankyoKey
    building_nobeyuka = "Nobeyuka"  # Nobeyuka
    building_newyouto = "NewYouto"   #NewYouto2
    drain_pipe_fc = settings["管渠レイヤ名"]  # DRAIN_PIPE
    drain_pipe_seqno = settings["管渠キーフィールド"]  # SEQNO
    drain_pipe_u_mnseq = settings["上流人孔IDフィールド"]  # U_MNSEQ
    drain_pipe_l_mnseq = settings["下流人孔IDフィールド"]  # L_MNSEQ
    drain_pipe_nobeyuka_sum = "NobeyukaSum"  # 接続延床面積フィールド
    drain_pipe_teikayuka = "TeikaYuka"  # 逓加延床面積フィールド

    # スキーマロックをテストする。
    util.test_schema_lock(drain_pipe_fc)

    # フィーチャー選択状態をチェック
    if util.is_selected_single_feature(drain_pipe_fc) == False:
        raise arcpy.ExecuteError("管渠の選択件数が不正です。1件だけ選択してください。")  # pro sdk側で1件だけ選択済みの想定

    # 上流管渠の逓加延床面積の集計値
    u_nobeyuka = 0.0
    for _nobeyuka in [u_nobeyuka1, u_nobeyuka2, u_nobeyuka3, u_nobeyuka4]:
        if _nobeyuka != "":
            u_nobeyuka += float(_nobeyuka)

    # 選択済み建物レイヤから、同一管渠キーで集計した延床面積を事前に取得する。
    target_fields_building = [building_kankyokey, building_nobeyuka, building_newyouto]
    building_nobeyuka_dict = {}
    with arcpy.da.SearchCursor(building_fc, target_fields_building) as cur:
        for row in cur:
            if row[0] is not None and row[1] is not None:
                coefficient = get_coefficient_value_or_default(settings, row[2])
                #[延べ床面積集計設定]の建物用途別補正係数を乗する
                nobeyuka = float(coefficient) * row[1]
                if row[0] in building_nobeyuka_dict:
                    building_nobeyuka_dict[row[0]] += nobeyuka
                else:
                    building_nobeyuka_dict[row[0]] = nobeyuka
    del cur

    # ユーザーが選択した管渠の延床面積を事前に計算し、レイヤ選択状態を解除する
    target_fields_search = [
        drain_pipe_seqno,
        drain_pipe_u_mnseq,
        drain_pipe_l_mnseq
        # NobeyukaSum
        # TeikaYuka
    ]
    first_selected_drain_pipe = [
        row[0:] for row in arcpy.da.SearchCursor(drain_pipe_fc, target_fields_search)
    ][0]
    first_calculated_drain_pipe = calculate_nobeyuka_values(
        building_nobeyuka_dict, first_selected_drain_pipe, u_nobeyuka
    )
    u_nobeyuka = first_calculated_drain_pipe[4]
    arcpy.SelectLayerByAttribute_management(
        drain_pipe_fc, "CLEAR_SELECTION"
    )  # 選択状態をクリア
 
    arcpy.AddMessage("下流追跡処理を実行中...")
    i = 0
    selected_l_manhole_seq = first_calculated_drain_pipe[2]
    selected_dps = {
        first_calculated_drain_pipe[0]: first_calculated_drain_pipe
    }  # ユーザーが選択した管渠
    # arcpy.AddMessage("初回:{0}".format(first_calculated_drain_pipe)) # debug

    while selected_l_manhole_seq is not None:
        #「下流人孔」に接続されている管渠が２本以上ある場合（合流する箇所）は追跡終了とする
        pipe_count = 0
        with arcpy.da.SearchCursor(
            drain_pipe_fc,
            [drain_pipe_l_mnseq],  # select句
            "{0} = {1}".format(drain_pipe_l_mnseq, selected_l_manhole_seq),  # where句
        ) as cursor:
            for r in cursor:
                pipe_count = pipe_count + 1
        del cursor
        if pipe_count > 1:
            arcpy.AddMessage("下流人孔に管渠が複数接続されているため追跡を停止します。")
            selected_l_manhole_seq = None
            break
            
        # 選択された管渠の属性値「下流人孔IDフィールド」と同じ「上流人孔IDフィールド」を持つ管渠を繰り返し検索する。
        drain_pipe_dict = []
        with arcpy.da.SearchCursor(
            drain_pipe_fc,
            target_fields_search,  # select句
            "{0} = {1}".format(drain_pipe_u_mnseq, selected_l_manhole_seq),  # where句
        ) as rows:
            for row in rows:
                drain_pipe_dict.append(row)
        del rows

        # arcpy.AddMessage(drain_pipe_dict)

        if len(drain_pipe_dict) == 1:
            calculated_drain_pipe = calculate_nobeyuka_values(
                building_nobeyuka_dict, drain_pipe_dict[0], u_nobeyuka
            )
            selected_dps[calculated_drain_pipe[0]] = calculated_drain_pipe
            selected_l_manhole_seq = calculated_drain_pipe[2]  # 選択された管渠の「下流人孔ID」を更新
            u_nobeyuka = calculated_drain_pipe[4]  # 上流管渠の延床面積(合計)を更新
            # arcpy.AddMessage("更新:{0}".format(calculated_drain_pipe)) # debug
        elif len(drain_pipe_dict) > 1:
            arcpy.AddMessage("下流側管渠が2件以上存在するため追跡を停止します。")
            selected_l_manhole_seq = None
        else:
            arcpy.AddMessage("下流側管渠が存在しないため追跡を停止します。")
            selected_l_manhole_seq = None

        i += 1
        if i > MAX_FEATURE_COUNT:
            error_msg = "下流追跡処理の実行回数が{0}回を超えました。下流人孔キーがループしている可能性があるので管渠フィーチャー({1}={2})を確認してください。"
            raise arcpy.ExecuteError(
                error_msg.format(
                    MAX_FEATURE_COUNT, drain_pipe_seqno, drain_pipe_dict[0][0]
                )
            )

    # 追跡した管渠を選択状態にする
    selected_dp_keys = list(selected_dps.keys())
    arcpy.AddMessage(
        "下流追跡処理を実行しました。対象フィーチャー({0}):{1}".format(drain_pipe_seqno, selected_dp_keys)
    )
    sql = "{} IN ({})".format("SEQNO", ",".join(map(str, selected_dp_keys)))
    arcpy.SelectLayerByAttribute_management(drain_pipe_fc, "NEW_SELECTION", sql)

    # フィーチャーの一時データを作成
    tmp_drain_pipe_fc = "tmp_" + drain_pipe_fc
    util.create_tmp_fc(drain_pipe_fc, tmp_drain_pipe_fc)

    # arcpy.AddMessage("対象フィールド:{0}".format(target_fields))
    target_fields_update = [
        drain_pipe_seqno,
        drain_pipe_nobeyuka_sum,
        drain_pipe_teikayuka,
    ]
    with arcpy.da.UpdateCursor(tmp_drain_pipe_fc, target_fields_update) as rows:
        for row in rows:
            # arcpy.AddMessage("更新前:{0}".format(row)) # debug
            if row[0] in selected_dps:
                dp = selected_dps[row[0]]
                row[1] = dp[3]
                row[2] = dp[4]
            # arcpy.AddMessage("更新後:{0}".format(row)) # debug
            rows.updateRow(row)
    del rows

    # SEQNO をキーに一時データから値をコピーする。
    util.update_target_fc(
        drain_pipe_fc,
        tmp_drain_pipe_fc,
        drain_pipe_seqno,
        [drain_pipe_nobeyuka_sum, drain_pipe_teikayuka],
    )

    arcpy.AddMessage("一時データを削除")
    arcpy.management.Delete(tmp_drain_pipe_fc)


def calculate_nobeyuka_values(building_nobeyuka_dict, drain_pipe, u_nobeyuka):
    """接続延床面積と逓加延床面積を計算して、リストの末尾に追加したオブジェクトを返す。

    Returns:
        list: [SEQNO, 上流人孔キー, 下流人孔キー, 接続延床面積, 逓加延床面積]
    """
    dp_seqno = drain_pipe[0]

    # 接続延床面積
    nobeyuka_sum = 0.0
    if dp_seqno in building_nobeyuka_dict:
        nobeyuka_sum = building_nobeyuka_dict[dp_seqno]

    # 逓加延床面積
    teikayuka = u_nobeyuka + nobeyuka_sum

    ret = drain_pipe + (nobeyuka_sum, teikayuka)
    return ret

def get_coefficient_value_or_default(settings_usages, bldg_usage):
    """建物用途を元に設定値リストを取得する。"""
    if bldg_usage is not None and bldg_usage in settings_usages.keys():
        return settings_usages[bldg_usage]
    else:
        return settings_usages["<その他の値全て>"]

if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)
        u_nobeyuka1 = arcpy.GetParameterAsText(1)
        u_nobeyuka2 = arcpy.GetParameterAsText(2)
        u_nobeyuka3 = arcpy.GetParameterAsText(3)
        u_nobeyuka4 = arcpy.GetParameterAsText(4)

        sequentialcal_calculate_teikayuka(
            ini_file_path, u_nobeyuka1, u_nobeyuka2, u_nobeyuka3, u_nobeyuka4
        )
    except Exception as e:
        arcpy.AddError(str(e))
        raise e 
