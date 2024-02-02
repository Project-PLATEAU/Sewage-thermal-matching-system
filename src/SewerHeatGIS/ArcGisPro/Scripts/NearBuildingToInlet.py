"""
最寄り管渠検索処理(桝):
　建物ポリゴンの境界と桝との距離で最近傍を検索し、検索された「接続管渠キーフィールド」を建物の「管渠とのキーが格納されるフィールド」に格納する。

"""
import arcpy
from Utils import SewerHeatGISUtil


def near_inlet(ini_file_path):
    """建物レイヤと桝レイヤの最寄り管渠検索を実行する。"""
    util = SewerHeatGISUtil()

    # ini形式の「設定ファイル」を読み込む
    settings = util.read_ini_settings(ini_file_path, "下水熱算出処理用設定ファイル")

    near_fid = "NEAR_FID"
    # near用パラメータ
    building_fc = settings["建物レイヤ名"]  # BUILDING_LOD0
    building_kankyoKey ="KankyoKey" # Kankyokey
    inlet_fc = settings["桝レイヤ名"]  # INLET
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
        inlet_fc,
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
    dpseq = settings["桝と管渠とのキーフィールド"]  # DPSEQ
    util.update_target_fc(
        tmp_building_fc, inlet_fc, near_fid, building_kankyoKey, "OBJECTID", dpseq
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

        near_inlet(ini_file_path)
    except Exception as e:
        arcpy.AddError(str(e))
        raise e
