"""
ポテンシャル計算:
　選択された管渠とその下流人孔の熱ポテンシャルを計算する。

"""

import arcpy
import numpy
from Utils import SewerHeatGISUtil


def calculate_potential(ini_file_path):
    """選択された管渠とその下流人孔の熱ポテンシャルを計算する。"""
    util = SewerHeatGISUtil()

    # ini形式の「ポテンシャル計算設定ファイル」を読み込む
    settings = util.read_ini_settings(ini_file_path, "ポテンシャル計算設定")

    # パラメータ
    # 管渠レイヤ設定
    drain_pipe_fc = settings["管渠レイヤ名"]  # DRAIN_PIPE
    drain_pipe_key = settings["管渠キーフィールド"]  # SEQNO
    drain_pipe_teikayuka = "TeikaYuka"  # TeikaYuka
    drain_pipe_sewerflow_s = "SewerFlow_S"
    drain_pipe_sewerflow_w = "SewerFlow_W"
    drain_pipe_sewerflow_y = "SewerFlow_Y"
    drain_pipe_potential_s = "Potential_S"
    drain_pipe_potential_w = "Potential_W"
    drain_pipe_potential_y = "Potential_Y"
    drain_pipe_l_mnseq = settings["下流人孔IDフィールド"]  # L_MNSEQ
    # 人孔レイヤ設定
    manhole_fc = settings["人孔レイヤ名"]  # MANHOLE
    manhole_key = settings["人孔キーフィールド"]  # SEQNO
    manhole_potential_s = "Potential_S"
    manhole_potential_w = "Potential_W"
    manhole_potential_y = "Potential_Y"
    # 流量既知点
    ryuryo_drain_pipe_key = settings["管渠ID"]  # 流量既知点における管渠のキーを直接記載する
    ryuryo_suiryou_s = float(settings["実測下水流量（夏）"])  # 流量既知点の流量を記載
    ryuryo_suiryou_w = float(settings["実測下水流量（冬）"])  # 流量既知点の流量を記載
    ryuryo_suiryou_y = float(settings["実測下水流量（年）"])  # 流量既知点の流量を記載
    # ポテンシャル計算係数
    youseki_hinetsu = float(settings["容積比熱"])
    diff_water_tempurature = float(settings["下水熱利用温度差"])

    # スキーマロックをテストする。
    util.test_schema_lock(drain_pipe_fc)
    util.test_schema_lock(manhole_fc)

    # 流量既知点のフィーチャーから逓加延床面積を取得する
    arcpy.AddMessage("流量既知点のデータを取得中...")
    ryuryo_drain_pipe = [
        row[0:]
        for row in arcpy.da.SearchCursor(
            drain_pipe_fc,
            [drain_pipe_key, drain_pipe_teikayuka],
            "{0} = {1}".format(drain_pipe_key, ryuryo_drain_pipe_key),
        )
    ]
    # arcpy.AddMessage(ryuryo_drain_pipe)
    if len(ryuryo_drain_pipe) < 1:
        raise arcpy.ExecuteError(
            "流量既知点の情報が不正です。{0}={1}の管渠データが存在しません。".format(
                drain_pipe_key, ryuryo_drain_pipe_key
            )
        )
    if ryuryo_drain_pipe[0][1] is None:
        raise arcpy.ExecuteError(
            "流量既知点の情報が不正です。{0}={1}の管渠データに逓加延床面積が入力されていません。".format(
                drain_pipe_key, ryuryo_drain_pipe_key
            )
        )

    if ryuryo_drain_pipe[0][1] == 0:
        raise arcpy.ExecuteError(
            "流量既知点の情報が不正です。{0}={1}の管渠データの逓加延床面積が0です。".format(
                drain_pipe_key, ryuryo_drain_pipe_key
            )
        )

    ryuryo_teikayuka = ryuryo_drain_pipe[0][1]

    # フィーチャーの一時データを作成
    tmp_drain_pipe_fc = "tmp_" + drain_pipe_fc
    util.create_tmp_fc(drain_pipe_fc, tmp_drain_pipe_fc)

    arcpy.AddMessage("熱ポテンシャル計算処理(管渠)を実行中...")
    manhole_potentials = {}
    count = 0
    target_fields_update_drain_pipe = [
        drain_pipe_key,
        drain_pipe_teikayuka,
        drain_pipe_sewerflow_s,
        drain_pipe_sewerflow_w,
        drain_pipe_sewerflow_y,
        drain_pipe_potential_s,
        drain_pipe_potential_w,
        drain_pipe_potential_y,
        drain_pipe_l_mnseq,
    ]
    with arcpy.da.UpdateCursor(
        tmp_drain_pipe_fc, target_fields_update_drain_pipe
    ) as rows:
        for row in rows:
            # arcpy.AddMessage("更新前:{0}".format(row)) # debug
            _teikayuka = 0.0
            if row[1] is not None:
                _teikayuka = row[1]
            # 流量既知点における「実測下水流量」×各フィーチャの「逓加延床面積」/流量既知点における「逓加延床面積」を推定下水流量に格納する
            suitei_karyu_s = ryuryo_suiryou_s * (_teikayuka / ryuryo_teikayuka)
            suitei_karyu_w = ryuryo_suiryou_w * (_teikayuka / ryuryo_teikayuka)
            suitei_karyu_y = ryuryo_suiryou_y * (_teikayuka / ryuryo_teikayuka)
            potential_s = suitei_karyu_s * youseki_hinetsu * diff_water_tempurature
            potential_w = suitei_karyu_w * youseki_hinetsu * diff_water_tempurature
            potential_y = suitei_karyu_y * youseki_hinetsu * diff_water_tempurature * 365
            row[2] = suitei_karyu_s
            row[3] = suitei_karyu_w
            row[4] = suitei_karyu_y
            row[5] = potential_s
            row[6] = potential_w
            row[7] = potential_y
            _potentials = numpy.array([potential_s, potential_w, potential_y])
            if row[8] in manhole_potentials:
                # arcpy.AddMessage("SEQNO={0}の下流管渠キー({1})が重複したので加算します。:{2}".format(row[0], row[8],_potentials)) # debug
                # arcpy.AddMessage("加算前:{0}".format(manhole_potentials[row[8]])) # debug
                manhole_potentials[row[8]] += _potentials
                # arcpy.AddMessage("加算後:{0}".format(manhole_potentials[row[8]])) # debug
            else:
                manhole_potentials[row[8]] = _potentials
            # arcpy.AddMessage("更新後:{0}".format(row)) # debug
            rows.updateRow(row)
            
            count = count + 1
            if count % 100 == 0:
                arcpy.AddMessage("{0} フィーチャを処理しました...".format(count))
    del rows
    arcpy.AddMessage("{0} フィーチャを処理しました。".format(count))

    # SEQNO をキーに一時データから値をコピーする。
    util.update_target_fc(
        drain_pipe_fc,
        tmp_drain_pipe_fc,
        drain_pipe_key,
        [
            drain_pipe_sewerflow_s,
            drain_pipe_sewerflow_w,
            drain_pipe_sewerflow_y,
            drain_pipe_potential_s,
            drain_pipe_potential_w,
            drain_pipe_potential_y,
        ],
    )

    # 実行結果を出力
    # arcpy.AddMessage(arcpy.GetMessages())

    arcpy.AddMessage("一時データを削除")
    arcpy.management.Delete(tmp_drain_pipe_fc)

    if len(manhole_potentials) > 0:
        # arcpy.AddMessage(manhole_potentials) # debug

        # 選択解除して、全ての人孔フィーチャを検索可能にする(地図上で人孔が選択状態だと、下流側の人孔が取得できないことがある)
        arcpy.SelectLayerByAttribute_management(manhole_fc, "CLEAR_SELECTION")

        tmp_manhole_fc = "tmp_" + manhole_fc
        util.create_tmp_fc(
            manhole_fc, tmp_manhole_fc, False
        )  # 管渠は地図上の選択状態を解除するので、データ数のコメント出力しない。

        arcpy.AddMessage("熱ポテンシャル計算処理(人孔)を実行中...")
        count = 0
        target_fields_update_manhole = [
            manhole_key,
            manhole_potential_s,
            manhole_potential_w,
            manhole_potential_y,
        ]
        with arcpy.da.UpdateCursor(
            tmp_manhole_fc, target_fields_update_manhole
        ) as rows:
            for row in rows:
                # arcpy.AddMessage("更新前:{0}".format(row)) # debug
                if row[0] in manhole_potentials:
                    _potentials = manhole_potentials[row[0]]
                    row[1] = _potentials[0]
                    row[2] = _potentials[1]
                    row[3] = _potentials[2]
                    # arcpy.AddMessage("更新後:{0}".format(row)) # debug
                    rows.updateRow(row)

                    count = count + 1
                    if count % 100 == 0:
                        arcpy.AddMessage("{0} フィーチャを処理しました...".format(count))
                # else:
                # arcpy.AddMessage("更新なし:{0}".format(row)) # debug
        del rows
        arcpy.AddMessage("{0} フィーチャを処理しました。".format(count))

        # SEQNO をキーに一時データから値をコピーする。
        util.update_target_fc(
            manhole_fc,
            tmp_manhole_fc,
            manhole_key,
            [manhole_potential_s, manhole_potential_w, manhole_potential_y],
        )
        arcpy.AddMessage("一時データを削除")
        arcpy.management.Delete(tmp_manhole_fc)


if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)

        calculate_potential(ini_file_path)
    except Exception as e:
        arcpy.AddError(str(e))
        raise e