"""
公開用スクリプト:
　公開用のFGDBを作成し、既に存在する公開用マップと公開用ローカルシーンの参照先を変更する

"""

import os
import datetime
import arcpy
from Utils import SewerHeatGISUtil


def publish_FGDB(
    edit_fgdb_fc_lod0_building,
    edit_fgdb_fc_lod1_building,
    edit_fgdb_fc_dorain_pipe,
    edit_fgdb_fc_manhole,
    drain_pipe_height_field,
    drain_pipe_to_height_field,
    manhole_height_field,
):
    util = SewerHeatGISUtil()

    # 定数
    edit_fgdb_name = "SewerHeatGIS.gdb"  # 編集用FGDB名
    publishing_fgdb_name = "publishing_SewerHeatGIS.gdb"  # 公開用FGDB名
    publishing_map_name = "公開用マップ"  # 公開用マップ名
    publishing_scene_name = "公開用シーン"  # 公開用シーン名

    # マップを全て閉じる
    util.aprx.closeViews()

    # デフォルトのFGDBが公開用FGDBだとエラーになるので編集用FGDBに設定する
    edit_fgdb_path = os.path.join(os.path.dirname(arcpy.env.workspace), edit_fgdb_name)
    util.aprx.defaultGeodatabase = edit_fgdb_path

    # debug
    # debug_layer_source(util, publishing_map_name, "処理実行前")

    # 既存の公開用FGDBをリネームして退避、新しい公開用FGDBとしてコピーする。
    publishing_fgdb_path = os.path.join(
        os.path.dirname(arcpy.env.workspace), publishing_fgdb_name
    )
    org_fgdb_name = "org_{0}.gdb".format(
        datetime.datetime.now().strftime("%Y%m%d%H%M")
    )  # 退避用FGDBファイル名
    org_fgdb_name_path = os.path.join(
        os.path.dirname(arcpy.env.workspace), org_fgdb_name
    )

    arcpy.AddMessage("【公開用FGDBをバックアップ】{0} → {1}".format(publishing_fgdb_path, org_fgdb_name_path))
    arcpy.management.Rename(publishing_fgdb_path, org_fgdb_name_path)
    arcpy.management.Copy(org_fgdb_name_path, publishing_fgdb_path)
    # 一度デフォルトとして追加することでプロジェクトに新しい公開用FGDBを追加する
    util.aprx.defaultGeodatabase = publishing_fgdb_path
    util.aprx.defaultGeodatabase = edit_fgdb_path
    util.aprx.save()

    # debug
    # debug_layer_source(util, publishing_map_name, "FGDB退避後")

    # FGDBの公開処理
    arcpy.AddMessage("【編集用FGDBから公開用FGDBを作成】{0} → {1}".format(edit_fgdb_path, publishing_fgdb_path))
    # 3D変換/投影変換
    try:
        convert_to_publish_data(
            edit_fgdb_fc_lod0_building,
            edit_fgdb_fc_lod1_building,
            edit_fgdb_fc_dorain_pipe,
            edit_fgdb_fc_manhole,
            publishing_fgdb_path,
            drain_pipe_height_field,
            drain_pipe_to_height_field,
            manhole_height_field,
        )
    except Exception as e:
        arcpy.AddError("エラーが発生しました")
        arcpy.AddMessage("【バックアップを公開用FGDBに差し戻し】{0} → {1}".format(org_fgdb_name_path, publishing_fgdb_path))
        arcpy.management.Delete(publishing_fgdb_path)
        arcpy.management.Rename(org_fgdb_name_path, publishing_fgdb_path)
        util.aprx.save()
        # debug
        # debug_layer_source(util, publishing_map_name, "エラー発生後")
        raise e

    # 公開用マップの参照先を新しい公開用FGDBに変更
    arcpy.AddMessage("公開用シーンのデータソース更新中...")
    for map_layer in util.get_map(publishing_map_name).listLayers():
        if map_layer.isFeatureLayer:
            arcpy.AddMessage("{0} is FeatureLayer".format(map_layer.name))
            new_layer_name = os.path.join(
                publishing_fgdb_path, map_layer.name
            )
            arcpy.AddMessage("【データソースのデータ差し替え】{0} → {1}".format(map_layer.dataSource, new_layer_name))
            map_layer.updateConnectionProperties(
                current_connection_info="", new_connection_info=publishing_fgdb_path
            )
        else:
            arcpy.AddMessage("{0} is not FeatureLayer".format(map_layer.name))

    # 公開用マップの更新を保存
    util.aprx.save()

    # debug
    # debug_layer_source(util, publishing_map_name, "マップ更新後")

    # シーンの参照先を公開用FGDBに変更
    arcpy.AddMessage("公開用シーンのデータソース更新中...")
    # debug_layer_source(util, publishing_scene_name, "シーン更新前")
    for scene_layer in util.get_map(publishing_scene_name).listLayers():
        if scene_layer.isFeatureLayer:
            arcpy.AddMessage("{0} is FeatureLayer".format(scene_layer.name))
            new_layer_name = os.path.join(
                publishing_fgdb_path, scene_layer.name
            )
            arcpy.AddMessage("【データソースのデータ差し替え】{0} → {1}".format(scene_layer.dataSource, new_layer_name))
 
            scene_layer.updateConnectionProperties(
                current_connection_info="", new_connection_info=publishing_fgdb_path
            )
        else:
            arcpy.AddMessage("{0} is not FeatureLayer".format(scene_layer.name))
    # debug_layer_source(util, publishing_scene_name, "シーン更新後")
    # 公開用マップの更新を保存
    util.aprx.save()

    # 不要になったFGDBを削除
    arcpy.management.Delete(org_fgdb_name_path)


def debug_layer_source(util, publishing_map_name, msg):
    map = util.get_map(publishing_map_name)
    arcpy.AddMessage("【{0}】マップ :{1}".format(msg, map.name))
    for map_layer in map.listLayers():
        arcpy.AddMessage("【{0}】レイヤ :{1}".format(msg, map_layer.name))
        arcpy.AddMessage("【{0}】ソース :{1}".format(msg, map_layer.dataSource))


def convert_to_publish_data(
    edit_fgdb_fc_lod0_building,
    edit_fgdb_fc_lod1_building,
    edit_fgdb_fc_dorain_pipe,
    edit_fgdb_fc_manhole,
    publishing_fgdb_path,
    drain_pipe_height_field,
    drain_pipe_to_height_field,
    manhole_height_field,
):
    lod0_building_fc_name = "BUILDING_LOD0"
    lod1_building_fc_name = "BUILDING_LOD1"
    drain_pipe_fc_name = "DRAIN_PIPE"
    manhole_fc_name = "MANHOLE"

    # 管渠を3D変換
    tmp_3d_drain_pipe_fc_path = os.path.join(
        publishing_fgdb_path, drain_pipe_fc_name + "_3D"
    )
    arcpy.AddMessage(
        "【管渠を3D変換】{0} → {1}".format(edit_fgdb_fc_dorain_pipe, tmp_3d_drain_pipe_fc_path)
    )
    arcpy.ddd.FeatureTo3DByAttribute(
        in_features=edit_fgdb_fc_dorain_pipe,
        out_feature_class=tmp_3d_drain_pipe_fc_path,
        height_field=drain_pipe_height_field,
        to_height_field=drain_pipe_to_height_field,
    )

    # 人孔を3D変換
    tmp_3d_manhole_fc_path = os.path.join(publishing_fgdb_path, manhole_fc_name + "_3D")
    arcpy.AddMessage(
        "【人孔を3D変換】{0} → {1}".format(edit_fgdb_fc_manhole, tmp_3d_manhole_fc_path)
    )
    arcpy.ddd.FeatureTo3DByAttribute(
        in_features=edit_fgdb_fc_manhole,
        out_feature_class=tmp_3d_manhole_fc_path,
        height_field=manhole_height_field,
        to_height_field=None,
    )

    # 建物(lod0)をWGS1984に投影変換
    wgs84_lod0_building_fc_path = os.path.join(
        publishing_fgdb_path, lod0_building_fc_name + "_WGS84"
    )
    arcpy.AddMessage(
        "【建物(lod0)をWGS1984に投影変換】{0} → {1}".format(
            edit_fgdb_fc_lod0_building, wgs84_lod0_building_fc_path
        )
    )
    arcpy.management.Project(
        in_dataset=edit_fgdb_fc_lod0_building,
        out_dataset=wgs84_lod0_building_fc_path,
        out_coor_system='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    # 建物(lod1)をWGS1984に投影変換
    wgs84_lod1_building_fc_path = os.path.join(
        publishing_fgdb_path, lod1_building_fc_name + "_WGS84"
    )
    arcpy.AddMessage(
        "【建物(lod1)をWGS1984に投影変換】{0} → {1}".format(
            edit_fgdb_fc_lod1_building, wgs84_lod1_building_fc_path
        )
    )
    arcpy.management.Project(
        in_dataset=edit_fgdb_fc_lod1_building,
        out_dataset=wgs84_lod1_building_fc_path,
        out_coor_system='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    # 管渠をWGS1984に投影変換
    wgs84_drain_pipe_fc_path = os.path.join(
        publishing_fgdb_path, drain_pipe_fc_name + "_WGS84"
    )
    arcpy.AddMessage(
        "【管渠をWGS1984に投影変換】{0} → {1}".format(
            tmp_3d_drain_pipe_fc_path, wgs84_drain_pipe_fc_path
        )
    )
    arcpy.management.Project(
        in_dataset=tmp_3d_drain_pipe_fc_path,
        out_dataset=wgs84_drain_pipe_fc_path,
        out_coor_system='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )
    # 人孔をWGS1984に投影変換
    wgs84_manhole_fc_path = os.path.join(
        publishing_fgdb_path, manhole_fc_name + "_WGS84"
    )
    arcpy.AddMessage(
        "【人孔をWGS1984に投影変換】{0} → {1}".format(
            tmp_3d_manhole_fc_path, wgs84_manhole_fc_path
        )
    )
    arcpy.management.Project(
        in_dataset=tmp_3d_manhole_fc_path,
        out_dataset=wgs84_manhole_fc_path,
        out_coor_system='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    arcpy.management.Delete(tmp_3d_drain_pipe_fc_path)
    arcpy.management.Delete(tmp_3d_manhole_fc_path)


if __name__ == "__main__":
    edit_fgdb_fc_lod0_building = arcpy.GetParameterAsText(0)
    edit_fgdb_fc_lod1_building = arcpy.GetParameterAsText(1)
    edit_fgdb_fc_dorain_pipe = arcpy.GetParameterAsText(2)
    edit_fgdb_fc_manhole = arcpy.GetParameterAsText(3)
    drain_pipe_height_field = arcpy.GetParameterAsText(4)
    drain_pipe_to_height_field = arcpy.GetParameterAsText(5)
    manhole_height_field = arcpy.GetParameterAsText(6)

    publish_FGDB(
        edit_fgdb_fc_lod0_building,
        edit_fgdb_fc_lod1_building,
        edit_fgdb_fc_dorain_pipe,
        edit_fgdb_fc_manhole,
        drain_pipe_height_field,
        drain_pipe_to_height_field,
        manhole_height_field,
    )
