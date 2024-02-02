import arcpy
import configparser


class SewerHeatGISUtil:
    aprx = None

    def __init__(self):
        arcpy.env.overwriteOutput = True
        self.aprx = arcpy.mp.ArcGISProject("CURRENT")

    def read_ini_settings(self, file_path, section_name):
        """iniファイルとセクションを指定してdictを返す。"""
        config = configparser.ConfigParser(inline_comment_prefixes=";")
        try:
            config.read(file_path, encoding="utf-8")
        except:
            raise arcpy.ExecuteError("設定ファイルを読み込めませんでした。:{0}".format(file_path))
        try:
            settings = config[section_name]
            return settings
        except:
            raise arcpy.ExecuteError(
                "設定ファイルにセクション[{0}]が存在しませんでした。".format(section_name)
            )

    def is_map_exist(self, map_name):
        """現在のプロジェクトでマップを存在チェックする。"""
        return len(self.aprx.listMaps(map_name)) > 0

    def get_map(self, map_name):
        """現在のプロジェクトから対象マップを取得する。"""
        if self.is_map_exist(map_name):
            return self.aprx.listMaps(map_name)[0]
        else:
            return None

    def is_layer_exist(self, layer_name):
        """現在のマップでレイヤーの存在チェックする。"""
        current_map = self.aprx.activeMap
        if current_map is not None:
            return len(current_map.listLayers(layer_name)) > 0
        else:
            return False

    def get_layer(self, layer_name):
        """現在のマップから、対象レイヤを取得する。"""
        if self.is_layer_exist(layer_name):
            current_map = self.aprx.activeMap
            return current_map.listLayers(layer_name)[0]
        else:
            return None

    def create_tmp_fc(self, fc, tmp_fc, is_output_msg=True):
        """一時データを作成して、データ数を取得する。"""
        arcpy.AddMessage("一時データを作成中...")
        arcpy.management.CopyFeatures(fc, tmp_fc)
        if is_output_msg:
            rows_count = arcpy.management.GetCount(tmp_fc)
            arcpy.AddMessage("{0}レイヤを{1}件コピーしました。".format(fc, rows_count))

    def update_target_fc(
        self,
        target_fc,
        source_fc,
        key_field,
        copy_field_list,
        source_key_field=None,
        source_copy_field_list=None,
    ):
        """対象のフィーチャレイヤを更新する。"""
        if isinstance(key_field, list) or isinstance(source_key_field, list):
            raise arcpy.ExecuteError
        if source_key_field is None:
            source_key_field = key_field
        if source_copy_field_list is None:
            source_copy_field_list = copy_field_list

        # 利用するフィールドをリストにする(リストの先頭がキー。それ以降は参照フィールド)
        source_fields = self.convert_cutsor_fields(
            source_key_field, source_copy_field_list
        )

        # コピー元のデータを取得
        source_field_dict = {}
        with arcpy.da.SearchCursor(source_fc, source_fields) as rows:
            for row in rows:
                source_field_dict[str(row[0])] = row[1:]  # キーはストリングで保持する
        del rows

        # コピー先のフィールドをリストにする(先頭がキー)
        target_fields = self.convert_cutsor_fields(key_field, copy_field_list)

        # スキーマロックをテストする。
        self.test_schema_lock(target_fc)

        # コピー元とキーが一致するコピー先の属性値を更新する
        with arcpy.da.UpdateCursor(target_fc, target_fields) as cursor:
            for row in cursor:
                if str(row[0]) in source_field_dict.keys():
                    # キー以外を更新する
                    row[1:] = source_field_dict[str(row[0])]
                else:
                    for i in range(len(row[1:])):
                        row[i + 1] = None  # キー以外をNullにする
                cursor.updateRow(row)
        del cursor

    def update_target_fc_only_not_none(
        self,
        target_fc,
        source_fc,
        key_field,
        copy_field_list,
        source_key_field=None,
        source_copy_field_list=None,
    ):
        """対象のフィーチャレイヤを更新する。"""
        if isinstance(key_field, list) or isinstance(source_key_field, list):
            raise arcpy.ExecuteError
        if source_key_field is None:
            source_key_field = key_field
        if source_copy_field_list is None:
            source_copy_field_list = copy_field_list

        # 利用するフィールドをリストにする(リストの先頭がキー。それ以降は参照フィールド)
        source_fields = self.convert_cutsor_fields(
            source_key_field, source_copy_field_list
        )
        
        # コピー元のデータを取得
        source_field_dict = {}
        with arcpy.da.SearchCursor(source_fc, source_fields) as rows:
            for row in rows:
                source_field_dict[str(row[0])] = row[1:]  # キーはストリングで保持する
        del rows

        # コピー先のフィールドをリストにする(先頭がキー)
        target_fields = self.convert_cutsor_fields(key_field, copy_field_list)
        
        # スキーマロックをテストする。
        self.test_schema_lock(target_fc)

        # コピー元とキーが一致するコピー先の属性値を更新する
        with arcpy.da.UpdateCursor(target_fc, target_fields) as cursor:
            for row in cursor:
                if str(row[0]) in source_field_dict.keys() and source_field_dict[str(row[0])][0] is not None:
                    #Noneの値以外を更新する
                    row[1:] = source_field_dict[str(row[0])]
                else:
                    continue
                cursor.updateRow(row)
        del cursor

    def convert_cutsor_fields(self, key_field, copy_field_list):
        """キーフィールドを先頭にして、カーソルで利用するフィールドリストに変換する。"""
        if not isinstance(copy_field_list, list):
            copy_field_list = [copy_field_list]
        fields = [key_field] + copy_field_list
        return fields

    def is_selected_single_feature(self, layer):
        """選択済みフィーチャが1件だけかチェックする。"""
        count = arcpy.GetCount_management(layer)[0]
        if int(count) == 1:
            return True
        else:
            return False

    def test_schema_lock(self, fc):
        """スキーマロックをチェックする。"""
        if arcpy.TestSchemaLock(fc) == False:
            error_msg = "{0}のスキーマロックが取得できません。属性テーブルを閉じる等の操作を実施してから再度実行してください。"
            raise arcpy.ExecuteError(error_msg.format(fc))
