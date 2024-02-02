"""
最寄り管渠検索処理(管渠):
　建物ポリゴンの境界と管渠との距離で最近傍を検索し、検索された「管渠キーフィールド」を建物の「管渠とのキーが格納されるフィールド」に格納する。

"""

import arcpy
from Utils import SewerHeatGISUtil


def near_drain_pipe(ini_file_path):
    """建物レイヤと管渠レイヤの最寄り管渠検索を実行する。"""
    util = SewerHeatGISUtil()

    # ini形式の「設定ファイル」を読み込む
    settings = util.read_ini_settings(ini_file_path, "下水熱算出処理用設定ファイル")

    near_fid = "NEAR_FID"
    # near用パラメータ
    building_fc = settings["建物レイヤ名"]  # BUILDING_LOD0
    building_kankyoKey ="KankyoKey" # Kankyokey
    drain_pipe_fc = settings["管渠レイヤ名"]  # DRAIN_PIPE
    drain_pipe_key = settings["管渠キーフィールド"]  # SEQNO
    search_radius = "{0} Meters".format(settings["検索距離"]) # 200
    location = "NO_LOCATION"
    angle = "NO_ANGLE"
    method = "GEODESIC"
    field_names = [["NEAR_FID", near_fid], ["NEAR_DIST", "NEAR_DIST"]]
    distance_unit = "Meters"

    # スキーマロックをテストする。
    util.test_schema_lock(building_fc)

    # フィーチャーの一時データを作成
    tmp_building_fc = "tmp_" + building_fc
    util.create_tmp_fc(building_fc, tmp_building_fc)

    # Near
    arcpy.AddMessage("Nearを実行中...")
    arcpy.analysis.Near(
        tmp_building_fc,
        drain_pipe_fc,
        search_radius,
        location,
        angle,
        method,
        field_names,
        distance_unit,
    )
    # Nearの実行結果を出力
    arcpy.AddMessage(arcpy.GetMessages())

    # tmp_tmp_building_fcの "Near_Fid" を元に drain_pipe_fc のSQENOを取得する
    util.update_target_fc(
        tmp_building_fc,
        drain_pipe_fc,
        near_fid,
        building_kankyoKey,
        "OBJECTID",
        drain_pipe_key,
    )

    tmp_kankyokey = "tmpKankyoKey"
    arcpy.CalculateField_management(
        tmp_building_fc, tmp_kankyokey, "!{0}!".format(building_kankyoKey), "PYTHON3"
    )

    # gen_建物ID をキーに一時データから値をコピーする。
    key_field = settings["建物キーフィールド"] # gen_建物ID
    util.update_target_fc_only_not_none(
        building_fc, tmp_building_fc, key_field, [building_kankyoKey, tmp_kankyokey]
    )
    arcpy.AddMessage("一時データを削除")
    arcpy.management.Delete(tmp_building_fc)


if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)

        near_drain_pipe(ini_file_path)
    except Exception as e:
        arcpy.AddError(str(e))
        raise e
