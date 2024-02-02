import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";
import { loadModules, showAlert } from "./Utils.js";

/** ArcGISのモジュールを読み込む */
let [Graphic, FeatureLayer, LabelClass, Polygon] = await loadModules([
    "esri/Graphic",
    "esri/layers/FeatureLayer",
    "esri/layers/support/LabelClass",
    "esri/geometry/Polygon",
]);

/** 需要家マッチング処理 */
class MatchingAction {
    constructor() {
        ////
        // マッチング処理(家屋選択)
        ////
        /** 「対象家屋選択」ボタン */
        this.kaokuActionElem = document.getElementById("matchingByKaokuAction");
        /** 「距離」(家屋→管渠のバッファ) */
        this.kaokuBufferSizeElem = document.getElementById("kaokuBufferSize");

        ////
        // マッチング処理(複数管渠選択)
        ////
        /** 「対象管渠選択」ボタン */
        this.drainPipesActionElem = document.getElementById("matchingByDrainPipesAction");

        ////
        // マッチング処理(人孔→複数管渠選択)
        ////
        /** 「対象人孔選択」ボタン */
        this.manholeAndDrainPipesActionElem = document.getElementById("matchingByManholeAndDrainPipesAction");
        /** 「距離」(人孔→家屋のバッファ) */
        this.manholeBufferSizeElem = document.getElementById("manholeBufferSize");

        /** マッチング結果で表示する家屋ラベル */
        this.heatDemandLabel = "'熱需要値:'";
        /** マッチング結果で表示する管渠ラベル */
        this.potentialLabel = "'熱ポテンシャル値:'";
        /** 空調の熱需要フィールド名(家屋) */
        this.kuchouHeatDemandName = "ReHeatDem3";
        /** 空調の熱ポテンシャルフィールド名(管渠・人孔) */
        this.kuchouHeatPotentialName = "Potential_Y";
        /** 給湯の熱需要フィールド名(家屋) */
        this.kyutouHeatDemandName = "ReHeatDem4";
        /** 給湯の熱ポテンシャルフィールド名(管渠・人孔) */
        this.kyutouHeatPotentialName = "Potential_Y";

        /** 家屋の管渠キーフィールド名 */
        this.KankyoKeyName = AppSettings.queryOutFields.buildingLod0.TmpKankyoKey;

        /** 最大バッファサイズ(m) */
        this.MAX_BUFFER_SIZE = 150;
        /** マッチング結果の少数以下桁数(有効桁数） */
        this.LABEL_SIGNIFICANT_DIGITS = 2;
    }

    /**
     * フィーチャー検索した結果をハイライトする。
     * @param {any} featureLayer 検索対象のフィーチャレイヤ
     * @param {any} query クエリ
     * @param {any} validObjectids 検索可能・有効なフィーチャのOBJECTID
     */
    async searchAndHighlight(featureLayer, query, validObjectids = []) {
        const features = await this.excuteSearch(
            featureLayer,
            query,
            validObjectids
        );

        // ハイライト
        if (features?.length > 0) {
            this.highlight(featureLayer, features);
        }

        return features;
    }

     /**
     * ハイライトに追加する。
     * @param {any} featureLayer 検索対象のフィーチャレイヤ
     * @param {any} query クエリ
     * @param {any} validObjectids 検索可能・有効なフィーチャのOBJECTID
     */
    async highlight(featureLayer, features) {
        const actionName = MapObj.currentAction.name;
        await MapObj.mapView.whenLayerView(featureLayer).then(async function (layerView) {
            if (!MapObj.currentAction || MapObj.currentAction.name !== actionName) {
                return []; // Actionが中断された場合は処理しない
            }

            for (const f of features) {
                const objectid = f.getObjectId();
                const highlight = layerView.highlight(objectid);
                MapObj.selectedFeatures.push({
                    OBJECTID: f.attributes["OBJECTID"],
                    layerName: featureLayer.title,
                    graphic: f,
                    highlight: highlight
                });
            }
        });
    }


    /**
     * フィーチャー検索をする
     * @param {any} featureLayer 検索対象のフィーチャレイヤ
     * @param {any} query クエリ
     * @param {any} validObjectids 検索可能・有効なフィーチャのOBJECTID
     */
    async excuteSearch(featureLayer, query, validObjectids = []) {
        //検索の開始
        const actionName = MapObj.currentAction.name;
        return await featureLayer.queryFeatures(query).then(async function (response) {
            if (!MapObj.currentAction || MapObj.currentAction.name !== actionName) {
                return []; // Actionが中断された場合は処理しない
            }
            const features = response.features;
            if (features.length === 0) {
                showAlert("検索対象が0件でした");
                return [];
            }

            const validFeatures = [];
            for (const f of features) {
                const objectid = f.getObjectId();
                //  検索可能・有効なフィーチャのOBJECTIDがパラメータに含まれていたらチェックする。
                if (validObjectids?.length > 0 && !validObjectids.includes(objectid)) {
                    continue;
                }

                validFeatures.push(f);

            }
            if (validFeatures.length === 0) {
                showAlert("検索対象が0件でした");
                return [];
            }

            return validFeatures;
        });
    }

    /**
     * バッファ検索用クエリを生成する
     * @param {any} featureLayer 検索対象のフィーチャレイヤ
     * @param {any} selectedFeature 選択した関連フィーチャ
     * @param {any} distance バッファ(m)
     */
    createBufferSearchQuery(featureLayer, selectedFeature,  distance) {
        const where = this.getBufferSearchWhereClause(featureLayer.title, selectedFeature.graphic.attributes);
        if (!where) {
            // 選択した関連フィーチャに属性値がない場合 nullを返す。
            return null;
        }

        const query = featureLayer.createQuery();
        query.geometry = selectedFeature.graphic.geometry;
        query.distance = distance;
        query.units = "meters";
        query.where = where;
        query.outFields = this.getOutFields(featureLayer.title);

        return query;
    }

    /** バッファ検索用の属性値フィルター(クエリのWhere) */
    getBufferSearchWhereClause(layerName, attributes) {
        let where = null;

        if (AppSettings.state.heatType === 3) {
            // 空調
            if (layerName === AppSettings.settings.layerNameBuildingLod0) {
                // 家屋を検索
                const param = attributes[this.kuchouHeatPotentialName];
                if (param) {
                    where = param + " >= " + this.kuchouHeatDemandName;
                }
            } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
                // 管渠を検索
                const param = attributes[this.kuchouHeatDemandName];
                if (param) {
                    where = this.kuchouHeatPotentialName + " >= " + param;
                }
            }
        }
        else if (AppSettings.state.heatType === 4) {
            // 給湯
            if (layerName === AppSettings.settings.layerNameBuildingLod0) {
                // 家屋を検索
                const param = attributes[this.kyutouHeatPotentialName];
                if (param) {
                    where = param + " >= " + this.kyutouHeatDemandName;
                }
            } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
                // 管渠を検索
                const param = attributes[this.kyutouHeatDemandName];
                if (param) {
                    where = this.kyutouHeatPotentialName + " >= " + param;
                }
            }
        }

        return where;
    }

    /**
     * 属性値検索用クエリを生成する
     * @param {any} featureLayer 検索対象のフィーチャレイヤ
     * @param {any} selectedFeatures フィーチャ
     */
    createAttributeSearchQuery(featureLayer, selectedFeatures) {
        const query = featureLayer.createQuery();
        query.where = this.getAttributeSearchWhereClause(featureLayer.title, selectedFeatures);
        query.outFields = this.getOutFields(featureLayer.title);

        return query;
    }

    /** 属性値検索用の属性値フィルター(クエリのWhere) */
    getAttributeSearchWhereClause(layerName, selectedFeatures) {
        let where = "";

        if (layerName === AppSettings.settings.layerNameBuildingLod0) {
            // ポテンシャル属性を元に、家屋をフィルターする条件式　※ポテンシャル値が 0 か null の場合は除外する
            const validFeatures = selectedFeatures.filter(x =>
                (
                    // 空調
                    (AppSettings.state.heatType === 3)
                    && (x.graphic.attributes[this.kuchouHeatPotentialName] > 0)
                ) ||
                    (
                    // 給湯
                    (AppSettings.state.heatType === 4)
                    && (x.graphic.attributes[this.kyutouHeatPotentialName] > 0)
                    )
            );
            if (validFeatures?.length === 0) {
                where = this.KankyoKeyName + " = -1";
                return where;
            }

            const kankyoKeys = validFeatures.map(x => x.graphic.attributes[AppSettings.settings.fieldNameDrainPipeKey]);
            where = this.KankyoKeyName + " in (" + kankyoKeys.join(",") + ")";
            if (AppSettings.state.heatType === 3) {
                // 空調
                where += " AND " + this.kuchouHeatDemandName + " > 0";
            }
            else if (AppSettings.state.heatType === 4) {
                // 給湯
                where += " AND " + this.kyutouHeatDemandName + " > 0";
            }
        }

        return where;
    }


    /** 利用属性の配列を取得 */
    getOutFields(layerName) {
        let outFields = null;
        if (layerName === AppSettings.settings.layerNameBuildingLod0) {
            outFields = [
                "OBJECTID",
                AppSettings.queryOutFields.buildingLod0.TmpKankyoKey,
                this.kuchouHeatDemandName,
                this.kyutouHeatDemandName,
            ];
        } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
            outFields = [
                "OBJECTID",
                AppSettings.queryOutFields.drainPipe.SEQNO,
                this.kuchouHeatPotentialName,
                this.kyutouHeatPotentialName,
            ];
        } else if (layerName === AppSettings.settings.layerNameManhole) {
            outFields = [
                "OBJECTID",
                this.kuchouHeatPotentialName,
                this.kyutouHeatPotentialName,
            ];
        }

        return outFields;
    }

    /** 表示ラベルを取得する */
    getLabelExpression(layerName) {
        let ret = null;

        if (AppSettings.state.heatType === 3) {
            // 空調
            if (layerName === AppSettings.settings.layerNameBuildingLod0) {
                ret = this.heatDemandLabel
                    + " + TextFormatting.NewLine + IIF(IsEmpty($feature."
                    + this.kuchouHeatDemandName
                    + "), '', Round($feature."
                    + this.kuchouHeatDemandName
                    + ", "
                    + this.LABEL_SIGNIFICANT_DIGITS
                    + "))";
            } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
                ret = this.potentialLabel
                    + " + TextFormatting.NewLine + IIF(IsEmpty($feature."
                    + this.kuchouHeatPotentialName
                    + "), '', Round($feature."
                    + this.kuchouHeatPotentialName
                    + ", "
                    + this.LABEL_SIGNIFICANT_DIGITS
                    + "))";
            }
        }
        else if (AppSettings.state.heatType === 4) {
            // 給湯
            if (layerName === AppSettings.settings.layerNameBuildingLod0) {
                ret = this.heatDemandLabel
                    + " + TextFormatting.NewLine + IIF(IsEmpty($feature."
                    + this.kyutouHeatDemandName
                    + "), '', Round($feature."
                    + this.kyutouHeatDemandName
                    + ", "
                    + this.LABEL_SIGNIFICANT_DIGITS
                    + "))";
            } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
                ret = this.potentialLabel
                    + " + TextFormatting.NewLine + IIF(IsEmpty($feature."
                    + this.kyutouHeatPotentialName
                    + "), '', Round($feature."
                    + this.kyutouHeatPotentialName
                    + ", "
                    + this.LABEL_SIGNIFICANT_DIGITS
                    + "))";
            }
        }

        return ret;
    }

    /** ラベルだけ表示されるFeatureLayer(透過)を作成する */
    createLabelLayer(features, layerName, symbolType, fields) {
        const symbol = {
            type: symbolType,
            color: [0, 0, 0, 0], // ラベル用のFeatureは透過させて非表示
            outline: null
        };
        const expression = this.getLabelExpression(layerName);
        const labelClass = new LabelClass({
            symbol: {
                type: "text",
                color: AppSettings.constants.labelTextColor,
                haloSize: 1,
                haloColor: "white",
                font: {
                    size: AppSettings.constants.labelTextSize,
                },
            },
            labelExpressionInfo: {
                expression: expression
            },
            maxScale: AppSettings.constants.labelMaxScale,
            minScale: AppSettings.constants.labelMinScale,
        });

        const graphics = []
        for (const f of features) {
            let geom = f.geometry;
            if (layerName === AppSettings.settings.layerNameDrainPipe) {
                // ラベルを回転させるためラインからポリゴンに変換
                geom = Polygon.fromExtent(geom.extent);
            }

            const graphic = new Graphic({
                geometry: geom,
                attributes: f.attributes,
            });
            graphics.push(graphic);
        }
        return new FeatureLayer({
            source: graphics,
            renderer: {
                type: "simple",
                symbol: symbol,
            },
            fields: fields,
            objectIdField: "OBJECTID",
            labelingInfo: labelClass
        });
    }

    /** ラベル表示用の家屋レイヤを作成する */
    addBuildingLod0LabelLayer(features) {
        const layerName = AppSettings.settings.layerNameBuildingLod0;
        const symbolType = "simple-fill";
        const fields = [{
            name: "OBJECTID", type: "oid"
        }, {
            name: this.kuchouHeatDemandName, type: "double"
        }, {
            name: this.kyutouHeatDemandName, type: "double"
        },];

        MapObj.buildingLod0LabelLayer = this.createLabelLayer(
            features,
            layerName,
            symbolType,
            fields
        );

        // 都度mapに追加する。
        MapObj.map.add(MapObj.buildingLod0LabelLayer);
    }

    /** ラベル表示用の管渠レイヤを作成する */
    addDrainPipeLabelLayer(features) {
        const layerName = AppSettings.settings.layerNameDrainPipe;
        const symbolType = "simple-fill";
        const fields = [{
            name: "OBJECTID", type: "oid"
        }, {
            name: this.kuchouHeatPotentialName, type: "double"
        }, {
            name: this.kyutouHeatPotentialName, type: "double"
        },];

        MapObj.drainPipeLabelLayer = this.createLabelLayer(
            features,
            layerName,
            symbolType,
            fields
        );

        // 都度mapに追加する。
        MapObj.map.add(MapObj.drainPipeLabelLayer);
    }

    /** ラベル表示用レイヤのクリア */
    clearLabelLayers() {
        if (MapObj.buildingLod0LabelLayer) {
            MapObj.map.remove(MapObj.buildingLod0LabelLayer);
            MapObj.buildingLod0LabelLayer = null;
        }

        if (MapObj.drainPipeLabelLayer) {
            MapObj.map.remove(MapObj.drainPipeLabelLayer);
            MapObj.drainPipeLabelLayer = null;
        }
    }

    /** ポテンシャル値チェック(選択フィーチャのポテンシャル値が全て0かNullの場合 true) */
    checkInvalidPotentialFeatures(selectedFeatures) {
        let invalidFeatures = true;
        for (const f of selectedFeatures) {
            if (AppSettings.state.heatType === 3) {
                if (f.graphic.attributes[this.kuchouHeatPotentialName]) {
                    invalidFeatures = false;
                }
            } else if (AppSettings.state.heatType === 4) {
                if (f.graphic.attributes[this.kyutouHeatPotentialName]) {
                    invalidFeatures = false;
                }
            }
        }

        return invalidFeatures;
    }

    /** マッチング処理1(家屋選択)の初期化
     *    -  「対象家屋選択」ボタンクリック
     *    -  「家屋」フィーチャを選択 */
    initializeActionByKaoku() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }
        const self = this;
        
        const targetLayer = AppSettings.settings.layerNameBuildingLod0;
        const isMultipleSelect = false;
        const canRemove = false;
        const mapClickFunction = async () => {
            if (MapObj.selectedFeatures.length === 0) {
                return;
            }
            MapObj.setMapClickNoSelect();

            // 選択済みの家屋からクエリを生成する。
            const selectedFeature = MapObj.selectedFeatures[0];
            const searchLayer = MapObj.drainPipeFeatureLayer;
            const distance = self.kaokuBufferSizeElem.value;
            const query = self.createBufferSearchQuery(searchLayer, selectedFeature, distance);
            if (!selectedFeature.graphic.attributes || !query) {
                showAlert("家屋の属性値が無効のため検索できません");
                return;
            }

            // 選択した家屋をラベル表示
            self.addBuildingLod0LabelLayer([selectedFeature.graphic]);

            // バッファ検索を実行
            const features = await self.searchAndHighlight(
                searchLayer,                
                query
            );
            // 検索した管渠(複数)をラベル表示
            if (features?.length > 0) {
                self.addDrainPipeLabelLayer(features);
            }
        };
        const endActionFunction = () => {
            self.clearLabelLayers();
            MapObj.clearMapClickHandleEvent();
        };

        MapObj.setActionTool(
            this.kaokuActionElem,
            targetLayer,
            isMultipleSelect,
            canRemove,
            mapClickFunction,
            endActionFunction
        );
    }

    /** マッチング処理2(複数管渠選択)の初期化
     *    -  「対象管渠選択」ボタンクリック
     *    -  「管渠」フィーチャを複数選択 */
    initializeActionByDrainPipes() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }
        const self = this;

        const targetLayer = AppSettings.settings.layerNameDrainPipe;
        const isMultipleSelect = true;
        const canRemove = true;
        const mapClickFunction = async (event) => {
            self.clearLabelLayers();
            MapObj.removeLayerSelectedFeatures(AppSettings.settings.layerNameBuildingLod0);

            const selectedFeatures = MapObj.selectedFeatures.filter(
                x => x.layerName === AppSettings.settings.layerNameDrainPipe
            );
            if (selectedFeatures?.length === 0) {
                MapObj.clearSelectedFeatures();
                showAlert("管渠を選択してください");
                return;
            }

            // 選択されている値が全て0かNullの場合はメッセージを表示して処理を終了させる
            const isInvalidDrainPipes = self.checkInvalidPotentialFeatures(selectedFeatures);
            if (isInvalidDrainPipes) {
                showAlert("管渠の属性値が無効のため検索できません");
                return;
            }

            self.addDrainPipeLabelLayer(selectedFeatures.map(x => x.graphic));

            // 選択済みの管渠からクエリを生成する。
            const searchLayer = MapObj.buildingLod0FeatureLayer;
            const query = self.createAttributeSearchQuery(searchLayer, selectedFeatures);

            // 属性検索を実行
            // 本来レイヤのJoinが必要な処理であるがクエリは単一レイヤに実行する構成のため、
            // キーによるマッチングだけをQueryで実行し、その結果に対してメモリ上で需要家マッチング処理を行うようにした。
            const features = await self.excuteSearch(
                searchLayer,
                query
            ).then((keyMatchiFeatures) => {
                const fs = [];

                for (const f of keyMatchiFeatures) {
                    // 熱需要と熱ポテンシャルをマッチング
                    let demand, potentialName;
                    if (AppSettings.state.heatType === 3) {
                        demand = f.attributes[self.kuchouHeatDemandName];
                        potentialName = self.kuchouHeatPotentialName;
                    } else if (AppSettings.state.heatType === 4) {
                        demand = f.attributes[self.kyutouHeatDemandName];
                        potentialName = self.kyutouHeatPotentialName;
                    }
                    const drainPipe = selectedFeatures.filter(x =>
                        !(x.graphic.attributes[potentialName] == null)
                        && x.graphic.attributes[potentialName] >= demand // 需要家マッチング
                    );

                    // 需要家マッチングした結果のみにフィルター
                    if (drainPipe?.length > 0) {
                        fs.push(f);
                    }
                }

                return fs;
            });

            // 検索した家屋をラベル表示
            if (features?.length > 0) {
                self.highlight(searchLayer, features);
                self.addBuildingLod0LabelLayer(features);
            } else {
                showAlert("検索対象が0件でした");
                return;
            }

        };
        const endActionFunction = () => {
            self.clearLabelLayers();
            MapObj.clearMapClickHandleEvent();
        };

        MapObj.setActionTool(
            this.drainPipesActionElem,
            targetLayer,
            isMultipleSelect,
            canRemove,
            mapClickFunction,
            endActionFunction
        );
    }

    /** マッチング処理3(人孔→複数管渠選択)の初期化
     *    -  「対象人孔選択」ボタンクリック
     *    -  「人孔」フィーチャを選択
     *    -  「管渠」フィーチャを複数選択 */
    initializeActionByManholeAndDrainPipes() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }
        const self = this;

        /** 人孔からバッファー検索した家屋フィーチャ */
        let searchBuildingFeatures = [];

        const targetLayer = AppSettings.settings.layerNameManhole;
        const isMultipleSelect = false;
        const canRemove = false;
        const mapClickFunctionSecond = async () => {
            // 家屋レイヤの選択済みフィーチャを解除
            self.clearLabelLayers();
            MapObj.removeLayerSelectedFeatures(AppSettings.settings.layerNameBuildingLod0);

            // 管渠選択
            let selectedDrainPipes = MapObj.selectedFeatures.filter(
                (f) => f.layerName === AppSettings.settings.layerNameDrainPipe
            );
            // 選択済み管渠と紐付く家屋を表示
            if (selectedDrainPipes?.length > 0) {
                // 選択されている値が全て0かNullの場合はメッセージを表示して処理を終了させる
                const isInvalidDrainPipes = self.checkInvalidPotentialFeatures(selectedDrainPipes);
                if (isInvalidDrainPipes) {
                    showAlert("管渠の属性値が無効のため検索できません");
                    return;
                }

                self.addDrainPipeLabelLayer(selectedDrainPipes.map(x => x.graphic));

                const searchLayer = MapObj.buildingLod0FeatureLayer;
                const query = self.createAttributeSearchQuery(
                    searchLayer,
                    selectedDrainPipes
                );

                // 人孔からバッファー検索した家屋から都度絞り込む
                const objectids = searchBuildingFeatures.map(x => x.attributes.OBJECTID);
                const features = await self.searchAndHighlight(
                    searchLayer,
                    query,
                    objectids
                );
                // 検索した家屋(複数)をラベル表示
                if (features?.length > 0) {
                    self.addBuildingLod0LabelLayer(features);
                }
            } else {
                showAlert("管渠を選択してください");
            }

        };
        const mapClickFunctionFirst = async() => {
            if (MapObj.selectedFeatures.length === 0) {
                return;
            }
            MapObj.clearMapClickHandleEvent();

            // 選択済みの人孔からクエリを生成する。
            const selectedFeature = MapObj.selectedFeatures[0];
            const searchLayer = MapObj.buildingLod0FeatureLayer;
            const distance = self.manholeBufferSizeElem.value;
            const query = self.createBufferSearchQuery(searchLayer, selectedFeature, distance);
            if (!selectedFeature.graphic.attributes || !query) {
                showAlert("人孔の属性値が無効のため検索できません");
                return;
            }

            // バッファ検索を実行
            searchBuildingFeatures = await self.excuteSearch(
                searchLayer,
                query
            );

            // イベントを切り替える。
            MapObj.setMapClickHandle(mapClickFunctionSecond, AppSettings.settings.layerNameDrainPipe, true, true); // 管渠を複数選択可・解除可
        };
        const endActionFunction = () => {
            searchBuildingFeatures = [];
            self.clearLabelLayers();
            MapObj.clearMapClickHandleEvent();
        };

        MapObj.setActionTool(
            this.manholeAndDrainPipesActionElem,
            targetLayer,
            isMultipleSelect,
            canRemove,
            mapClickFunctionFirst,
            endActionFunction
        );
    }

    /** 初期化 */
    initialize() {
        this.kaokuBufferSizeElem.addEventListener("change", () => {
            if (Math.sign(this.kaokuBufferSizeElem.value) !== 1) {
                this.kaokuBufferSizeElem.value = 0; // 正の数値でなければ0に補正
            } else if (this.kaokuBufferSizeElem.value > this.MAX_BUFFER_SIZE) {
                this.kaokuBufferSizeElem.value = this.MAX_BUFFER_SIZE;
            }
        });
        this.manholeBufferSizeElem.addEventListener("change", () => {
            if (Math.sign(this.manholeBufferSizeElem.value) !== 1) {
                this.manholeBufferSizeElem.value = 0; // 正の数値でなければ0に補正
            } else if (this.manholeBufferSizeElem.value > this.MAX_BUFFER_SIZE) {
                this.manholeBufferSizeElem.value = this.MAX_BUFFER_SIZE;
            }
        });

        this.initializeActionByKaoku();
        this.initializeActionByDrainPipes();
        this.initializeActionByManholeAndDrainPipes();
    }
};

/** 需要家マッチング処理(ActionTools) */
const MapActionMatching = new MatchingAction();
export { MapActionMatching };