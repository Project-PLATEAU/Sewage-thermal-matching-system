"""
レイヤ名のキー(設定ファイルのキー)によって指定されたレイヤの選択状態を解除する:

"""
import arcpy
import sys
from Utils import SewerHeatGISUtil

if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)
        section_name =  arcpy.GetParameterAsText(1)
        layer_key_name = arcpy.GetParameterAsText(2)

        if ini_file_path is None:
            raise arcpy.ExecuteError("ファイルパスが存在しません。:{0}".format(section_name))
        if section_name is None:
            raise arcpy.ExecuteError("セクション名が存在しません。:{0}".format(section_name))       
        if layer_key_name is None:
            raise arcpy.ExecuteError("キー名が存在しません。:{0}".format(section_name))

       
        util = SewerHeatGISUtil()
        settings = util.read_ini_settings(ini_file_path, section_name)
       
        if settings is None:
            #必要なセクション名が無いのでエラー
            raise arcpy.ExecuteError("設定値が不正です。:{0}".format(section_name))

        if layer_key_name not in settings:
            #必要なキー情報がないためエラー
            raise arcpy.ExecuteError("キーが設定されていません。:{0}".format(name))

        if settings[layer_key_name] is None or settings[layer_key_name] == "":
            raise arcpy.ExecuteError("設定値が不正です。:{0}".format(name))

        # レイヤの選択を解除する
        arcpy.SelectLayerByAttribute_management(
            settings[layer_key_name], "CLEAR_SELECTION"
        )
 
        sys.exit(0)

    except Exception as e:
        arcpy.AddError(str(e))
        raise e