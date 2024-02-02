"""
設定ファイルを読みこみ内容をチェックする:
　指定した設定ファイルを読み、セクション名とレイヤ名をチェックする

"""
import arcpy
import sys
from Utils import SewerHeatGISUtil

if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)
        section_name = arcpy.GetParameterAsText(1)
     
        util = SewerHeatGISUtil()
        settings = util.read_ini_settings(ini_file_path, section_name)
       
        layerNames = []
        if section_name == "下水熱算出処理用設定ファイル":
            #レイヤチェック
            layerNames.append("建物レイヤ名")
            layerNames.append("管渠レイヤ名")
            layerNames.append("人孔レイヤ名")
            layerNames.append("桝レイヤ名")

        elif section_name == "建物用途変換テーブル":
            pass

        elif section_name == "延床面積集計設定":
            layerNames.append("建物レイヤ名")
            layerNames.append("管渠レイヤ名")

        elif section_name == "ポテンシャル計算設定":
            layerNames.append("管渠レイヤ名")
            layerNames.append("人孔レイヤ名")

        else:
            #必要なセクション名が無いのでエラー
            raise arcpy.ExecuteError("セクション名が無効です。:{0}".format(section_name))

        for name in layerNames:
            if name not in settings:
                #必要なキー情報がないためエラー
                raise arcpy.ExecuteError("レイヤ名が設定されていません。:{0}".format(name))

            if settings[name] is None or settings[name] == "":
                raise arcpy.ExecuteError("レイヤ名の設定値が不正です。:{0}".format(name))

            if not util.is_layer_exist(settings[name]):
                #指定されたレイヤ名がマップ上に存在しないためエラー
                raise arcpy.ExecuteError("指定されたレイヤ名がマップ上に存在しません。:{0}".format(settings[name]))

        sys.exit(0)

    except Exception as e:
        arcpy.AddError(str(e))
        raise e