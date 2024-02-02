"""
設定ファイルを読みこみ「」の設定値をチェックする:

"""
import arcpy
import sys
from Utils import SewerHeatGISUtil

if __name__ == "__main__":
    try:
        # 設定ファイルパス
        ini_file_path = arcpy.GetParameterAsText(0)
        section_name = "下水熱算出処理用設定ファイル"
       
        util = SewerHeatGISUtil()
        settings = util.read_ini_settings(ini_file_path, section_name)
       
        if settings is None:
            #必要なセクション名が無いのでエラー
            raise arcpy.ExecuteError("セクション名が存在しません。:{0}".format(section_name))

        name = "桝と管渠とのキーフィールド"
        if name not in settings:
            #必要なキー情報がないためエラー
            raise arcpy.ExecuteError("キーが設定されていません。:{0}".format(name))

        if settings[name] is None or settings[name] == "":
            raise arcpy.ExecuteError("設定値が不正です。:{0}".format(name))

        sys.exit(0)

    except Exception as e:
        arcpy.AddError(str(e))
        raise e