"""
熱需要算出処理(延床面積計算を含む):
　対象の建物レイヤに対して、延床面積算出と熱需要算出処理を実行する。


"""

import arcpy
import math
from Utils import SewerHeatGISUtil


def read_ini1_settings(ini_file_path):
    """設定ファイルを読み込み、建物レイヤのスキーマロックをチェックする。"""
    util = SewerHeatGISUtil()

    settings = util.read_ini_settings(ini_file_path, "下水熱算出処理用設定ファイル")

    building_fc = settings["建物レイヤ名"]  # BUILDING_LOD0
    if arcpy.TestSchemaLock(building_fc) == False:
        raise arcpy.ExecuteError(
            "{0}のスキーマロックが取得できません。属性テーブルを閉じる等の操作を実施してから再度実行してください。".format(building_fc)
        )

    return settings


def calculate_nobeyuka(settings):
    """延床面積算出処理を実行する。"""
    util = SewerHeatGISUtil()

    # パラメータ
    building_fc = settings["建物レイヤ名"]  # BUILDING_LOD0
    calculated_nobeyuka_field = "Nobeyuka"  # 延床面積格納フィールド
    total_floor_area = settings["延床面積フィールド"]  # uro_buildingDetails_totalFloorArea
    bldg_storeys_above_ground = settings["地上階数フィールド"]  # bldg_storeysAboveGround
    bldg_storeys_below_ground = settings["地下階数フィールド"]  # bldg_storeysBelowGround
    foot_print = settings["床面積フィールド"]  # FootPrint
    bldg_measured_height = settings["計測高さフィールド"]  # bldg_measuredHeight
    storeys_offset1 = settings["延床補正係数1"]  # 4.89
    storeys_offset2 = settings["延床補正係数2"]  # 4.2

    # スキーマロックをテストする。
    util.test_schema_lock(building_fc)

    # フィーチャーの一時データを作成
    tmp_building_fc = "tmp_" + building_fc
    util.create_tmp_fc(building_fc, tmp_building_fc)

    # 延床面積を計算する
    arcpy.AddMessage("延床面積算出処理を実行中...")
    count = 0
    target_fields = [
        calculated_nobeyuka_field,
        total_floor_area,
        bldg_storeys_above_ground,
        bldg_storeys_below_ground,
        foot_print,
        bldg_measured_height,
    ]
    # 延床面積計算処理
    with arcpy.da.UpdateCursor(tmp_building_fc, target_fields) as rows:
        for row in rows:
            # arcpy.AddMessage("更新前:{0}".format(row)) # debug
            if is_valid_numeric(row[1]):
                # 「延床面積フィールド」で指定したフィールドに値が入っている場合
                row[0] = row[1]
            elif is_valid_numeric(row[2]) or is_valid_numeric(row[3]):
                # 「延床面積フィールド」が0もしくは空欄の場合
                if is_valid_numeric(row[4]) == False:
                    row[0] = 0
                else:
                    _above_ground = 0
                    if is_valid_numeric(row[2]):
                        _above_ground = int(row[2])

                    _below_ground = 0
                    if is_valid_numeric(row[3]):
                        _below_ground = int(row[3])

                    # 「床面積」×（「地上階数」＋「地下階数」）で延床面積を計算し「延床面積格納フィールド」に格納する
                    row[0] = row[4] * (
                        _above_ground + _below_ground
                    )
            else:
                # 「地上階数」も「地下階数」も0もしくは空欄の場合
                if is_valid_numeric(row[4]) and is_valid_numeric(row[5]):
                    # 階数のデフォルトが1F
                    _storeys = 1

                    # 「計測高さ」－「延床補正係数1」を計算する
                    diff_height = row[5] - float(storeys_offset1)
                    if diff_height >= 0:  # 計算結果がプラスになる場合は以下を追加で計算する
                        #  「延床補正係数2」で割った商（少数以下は切り捨て）を階数として、階数を追加する
                        _storeys += math.floor(diff_height / float(storeys_offset2))

                    row[0] = row[4] * _storeys  # 「床面積」× 階数
                else:
                    row[0] = 0

            # arcpy.AddMessage("更新後:{0}".format(row)) # debug
            rows.updateRow(row)

            count = count + 1
            if count % 1000 == 0:
                arcpy.AddMessage("{0} フィーチャを処理しました...".format(count))
    del rows
    arcpy.AddMessage("{0} フィーチャを処理しました。".format(count))

def is_valid_numeric(value):
    """対象フィールドに有効値か入っているかチェックする。(None,空欄,0以外が入っているか)"""
    return (value is None or value == "" or math.isclose(float(value), 0)) == False


def calculate_heat_demands(settings, ini_file_path2):
    """熱需要算出処理を実行する。"""
    util = SewerHeatGISUtil()

    # パラメータ
    building_fc = settings["建物レイヤ名"]  # lod0_Building
    calculated_nobeyuka_field = "Nobeyuka"  # 延床面積格納フィールド
    area_offset = settings["地域補正"]  # 関東,1.0,1.0
    bldg_usage = settings["建物用途フィールド"]  # bldg_usage
    area_offset_list = area_offset.split(",")
    area_name = area_offset_list[0]
    area_offset_cooler = float(area_offset_list[1])
    area_offset_heater = float(area_offset_list[2])
    heat_demand_cooler = "HeatDemand1"
    heat_demand_heater = "HeatDemand2"
    heat_demand_air_conditioner = "HeatDemand3"
    heat_demand_water_heater = "HeatDemand4"
    new_youto = "NewYouto"  # 熱需要算出処理での原単位を格納
    re_heat_dem_3 = "ReHeatDem3"  # Onlineでの熱需要地変更処理で計算した値を格納（空調）
    re_heat_dem_4 = "ReHeatDem4"  # Onlineでの熱需要地変更処理で計算した値を格納（給湯）

    # フィーチャーの一時データは calculate_nobeyuka で作成済み
    tmp_building_fc = "tmp_" + building_fc

    # ini形式の「建物用途変換ファイル」を読み込む
    settings_usages = util.read_ini_settings(ini_file_path2, "建物用途変換テーブル")

    # 熱需要算出処理
    arcpy.AddMessage("熱需要算出処理を実行中...")
    count = 0
    target_fields = [
        calculated_nobeyuka_field,
        bldg_usage,
        heat_demand_cooler,
        heat_demand_heater,
        heat_demand_air_conditioner,
        heat_demand_water_heater,
        new_youto,
        re_heat_dem_3,
        re_heat_dem_4,
    ]
    with arcpy.da.UpdateCursor(tmp_building_fc, target_fields) as rows:
        for row in rows:
            # arcpy.AddMessage("更新前:{0}".format(row)) # debug
            nobeyuka = row[0]
            usage_offset_list = get_usage_offset_list_or_default(
                settings_usages, row[1]
            )
            usage_youto = usage_offset_list[0]
            usage_offset_cooler = float(usage_offset_list[1])
            usage_offset_heater = float(usage_offset_list[2])
            usage_offset__water_heater = float(usage_offset_list[3])

            # 熱需要値
            calculated_heat_dem1 = calculate_heat_demand(
                area_offset_cooler, nobeyuka, usage_offset_cooler
            )  # 熱需要値(冷房)
            calculated_heat_dem2 = calculate_heat_demand(
                area_offset_heater, nobeyuka, usage_offset_heater
            )  # 熱需要値(暖房)
            calculated_heat_dem3 = None
            if calculated_heat_dem1 is not None and calculated_heat_dem2 is not None:
                calculated_heat_dem3 = float(calculated_heat_dem1) + float(calculated_heat_dem2); # 熱需要値(空調)
            calculated_heat_dem4 = calculate_heat_demand(
                1, nobeyuka, usage_offset__water_heater
            )  # 熱需要値(給湯)

            # 更新
            row[2] = calculated_heat_dem1
            row[3] = calculated_heat_dem2
            row[4] = calculated_heat_dem3
            row[5] = calculated_heat_dem4
            row[6] = usage_youto
            row[7] = calculated_heat_dem3
            row[8] = calculated_heat_dem4
            rows.updateRow(row)

            count = count + 1
            if count % 1000 == 0:
                arcpy.AddMessage("{0} フィーチャを処理しました...".format(count))
            # arcpy.AddMessage("更新後:{0}".format(row)) # debug
    del rows
    arcpy.AddMessage("{0} フィーチャを処理しました。".format(count))

    # gen_建物ID をキーに一時データから値をコピーする。
    key_field = settings["建物キーフィールド"] # gen_建物ID
    updated_fields = [
        calculated_nobeyuka_field,
        heat_demand_cooler,
        heat_demand_heater,
        heat_demand_air_conditioner,
        heat_demand_water_heater,
        new_youto,
        re_heat_dem_3,
        re_heat_dem_4,
    ]
    util.update_target_fc(building_fc, tmp_building_fc, key_field, updated_fields)

    arcpy.AddMessage("一時データを削除")
    arcpy.management.Delete(tmp_building_fc)


def get_usage_offset_list_or_default(settings_usages, bldg_usage):
    """建物用途を元に設定値リストを取得する。"""
    if bldg_usage is not None and bldg_usage in settings_usages.keys():
        return settings_usages[bldg_usage].split(",")
    else:
        return settings_usages["<その他の値全て>"].split(",")


def calculate_heat_demand(area_offset, nobeyuka, heat_demand_offset):
    """熱需要を計算する。"""
    if nobeyuka is None:
        return None

    result = area_offset * nobeyuka * heat_demand_offset

    return result


if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)
        ini_file_path2 = arcpy.GetParameterAsText(1)

        settings = read_ini1_settings(ini_file_path)

        calculate_nobeyuka(settings)

        calculate_heat_demands(settings, ini_file_path2)
    except Exception as e:
        arcpy.AddError(str(e))
        raise e
