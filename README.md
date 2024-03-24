# 下水熱ポテンシャルマッチングシステム <!-- OSSの対象物の名称を記載ください。分かりやすさを重視し、できるだけ日本語で命名ください。英語名称の場合は日本語説明を（）書きで併記ください。 -->

![概要](./img/Readme_001.png) <!-- OSSの対象物のスクリーンショット（画面表示がない場合にはイメージ画像）を貼り付けください -->

## 1. 概要 <!-- 本リポジトリでOSS化しているソフトウェア・ライブラリについて1文で説明を記載ください -->
本リポジトリでは、Project PLATEAUの令和4年度のユースケース開発業務の一部であるUC23-013「下水熱利用促進UC」について、その成果物である「ポテンシャルマップ作成ツール」「下水熱ツール」の２種類のソースコードを公開しています。

「ポテンシャルマップ作成ツール」は、公開するためのポテンシャルマップを作成するためのツールで、「下水熱ツール」はPLATEAUの3D都市モデルを活用し、需要家マッチング・帳票作成・利用検討ツール作成を行うためのシステムです。
両ツールはArcGIS Pro3.1.3及びArcGIS Onlineを前提とするプラグイン等として構成されています。

## 2. 「下水熱ポテンシャルマッチングシステム 」について <!-- 「」内にユースケース名称を記載ください。本文は以下のサンプルを参考に記載ください。URLはアクセンチュアにて設定しますので、サンプルそのままでOKです。 -->
「ポテンシャルマップ作成ツールおよび下水熱ツール」では、カーボンニュートラルや脱炭素社会実現の施策推進のために地域の未利用エネルギーである下水熱の利用を促進することを目的として本システムを開発しました。本システムは、下水道熱ポテンシャルの算定・建物の熱需要量の算定といった計算機能に加えて、管渠と家屋のマッチング機能、ヒートポンプ配置、検討や調書出力等の適地検討機能を実装しています。本システムは、行政職員向けのGUIを備えたオープンソースソフトウェアとしてフルスクラッチで開発されています。

本システムの詳細については[技術検証レポート](https://XXX)を参照してください。

## 3. 利用手順 <!-- 下記の通り、GitHub Pagesへリンクを記載ください。URLはアクセンチュアにて設定しますので、サンプルそのままでOKです。 -->

本システムの構築手順及び利用手順については[利用チュートリアル](https://project-plateau.github.io/Sewage-thermal-matching-system/)を参照してください。

## 4. システム概要 <!-- OSS化対象のシステムが有する機能を記載ください。 -->
### 【ポテンシャルマップ作成ツール】
#### ①建物の熱需要量推定機能
- 建物が持つ属性項目をもとに、各建物が持つ熱需要を計算する。
- 建物の延床面積が不明な場合、建物の高さ、図形面積、建物階数データ等をもとに推定延床面積を計算する。

#### ②建物と管渠の紐づけ機能
- 各建物と管渠を空間結合し、各建物の汚水排水先管渠を紐づけることで、下水熱ポテンシャル計算の基礎情報を付与する。
- 紐づけ方法は、建物と管渠の空間的な位置関係もしくは、建物と桝の空間的な位置関係のどちらかを選択して紐づけを実施することができる。

#### ③下水熱賦存量の推定機能
- 延床面積の集計値と下水流量をもとに、管渠が持つ下水熱ポテンシャル値を作成する。

### 【下水熱ツール】
#### ④表示地区選択機能
- 処理区を選択させることで、表示させる図形の範囲を選択する。

#### ⑤熱需要量の実績値登録機能
- 選択した建物に対してユーザーが熱需要量の実績値を登録できる。

#### ⑥需要家マッチング機能
- 管渠と建物のデータを用いて、熱需要のマッチングができる。マッチング方法については、建物を指定する方法と管渠を指定する方法を選択できる。

#### ⑦帳票出力機能
- 建物や管渠の属性などを用いて帳票を作成し、PDF形式で出力できる。

#### ⑧ヒートポンプ配置検討機能
- ヒートポンプが設置可能な場所を３D表示で検討できる。

#### ⑨下水熱利用可能性簡易検討ツールへの属性値反映機能
- 建物や管渠の属性値を用いて、「下水熱利用可能性検討ツール（Excel）」に必要な値を入力した状態でダウンロードできる。

#### ⑩３D表示機能
- 地下埋設物モデルデータを３Dで表示できる。


## 5. 利用技術

| 種別              | 名称   | バージョン | 内容 |
| ----------------- | --------|-------------|-----------------------------|
| ミドルウェア       | [Microsoft.NET](https://www.microsoft.com/ja-jp/) | 6.0.5 | 計算処理用PCのメインソフトウェア実行環境 |
| ソフトウェア      | [ArcGIS Pro](https://www.esrij.com/products/arcgis-pro/) | 3.1.3 | 計算処理用PCのメインソフトウェア |
|       | [ArcGIS Online](https://www.esrij.com/products/arcgis-online/) | - | システム利用者閲覧用PCのメインソフトウェア |
|       | [EPPlus](https://epplussoftware.com/ja) | 6.2.4 | サーバ上でExcelを編集するソフトウェア |
|       | [ArcGIS Maps SDK for JavaScript](https://www.esrij.com/products/arcgis-maps-sdk-for-javascript/) | 4.28 | WebサイトにGIS（地図）機能を組み込むためのAPI |
|       | [iTextSharp.LGPLv.Core](https://www.nuget.org/packages/iTextSharp.LGPLv2.Core) | 3.4.12 | PDFを生成するライブラリ |
|       | [node.js](https://nodejs.org/en) | 20.11.0 | JavaScript実行環境 |

## 6. 動作環境（計算処理用PC） <!-- 動作環境についての仕様を記載ください。 -->
| 項目               | 最小動作環境                                                                                                                                                                                                                                                                                                                                    | 推奨動作環境                   | 
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | 
| OS                 | Microsoft Windows 10 または 11                                                                                                                                                                                                                                                                                                                  |  同左 | 
| CPU                | Intel Core i3以上                                                                                                                                                                                                                                                                                                                               | Intel Core i5以上              | 
| メモリ             | 8GB以上                                                                                                                                                                                                                                                                                                                                         | 32GB以上                        | 
| ディスプレイ解像度 | 1024×768以上                                                                                                                                                                                                                                                                                                                                    |  1080p以上                   | 
| ブラウザー       | Google Chrome バージョン 115 以降<br>Microsoft Edge バージョン 115 以降<br>Mozilla Firefox バージョン 117 以降<br>Mozilla Firefox バージョン 115 (ESR)<br>Safari バージョン 16 以降 |  同左                            | 
| ネットワーク       | ライセンス認証にネットワーク環境が必要<br>背景地図を表示させるために以下のURLを閲覧<br>できる環境が必要<br>・背景の標準地図<br>https://services.arcgisonline.com |  同左                            | 

## 7. 本リポジトリのフォルダ構成 <!-- 本GitHub上のソースファイルの構成を記載ください。 -->
| フォルダ名 |　詳細 |
|-|-|
| SewerHeatGIS | ArcGIS Pro処理スクリプト(Pythonスクリプト) |
| SewerHeatGIS_ProAppModule |ラム |
| SewerHeatGIS.sln | ソリューションファイル(Visual Studio) |

## 8. ライセンス <!-- 変更せず、そのまま使うこと。 -->

- ソースコード及び関連ドキュメントの著作権は国土交通省に帰属します。
- 本ドキュメントは[Project PLATEAUのサイトポリシー](https://www.mlit.go.jp/plateau/site-policy/)（CCBY4.0及び政府標準利用規約2.0）に従い提供されています。

## 9. 注意事項 <!-- 変更せず、そのまま使うこと。 -->

- 本リポジトリは参考資料として提供しているものです。動作保証は行っていません。
- 本リポジトリについては予告なく変更又は削除をする可能性があります。
- 本リポジトリの利用により生じた損失及び損害等について、国土交通省はいかなる責任も負わないものとします。

## 10. 参考資料 <!-- 技術検証レポートのURLはアクセンチュアにて記載します。 -->
- 技術検証レポート: https://www.mlit.go.jp/plateau/file/libraries/doc/XXXX
- PLATEAU WebサイトのUse caseページ「カーボンニュートラル推進支援システム」: https://www.mlit.go.jp/plateau/use-case/uc22-013/
