/** 共通データ・設定値 */
const AppSettings = {
    /** 設定ファイル */
    settings: {
        /** (デフォルト)地図ズームレベル */
        zoom: 18,
        /** (デフォルト)地図中心 */
        center: [134.6853859, 34.8151693],
        /** 対象地域  */
        chiki: "兵庫県",
        /** 建物レイヤ名(lod0) */
        layerNameBuildingLod0: "BUILDING_LOD0_WGS84",
        /** 建物レイヤ名(lod1) */
        layerNameBuildingLod1: "BUILDING_LOD1_WGS84",
        /** 建物キーフィールド */
        fieldNameBuildingKey: "gen_建物ID",
        /** 管渠レイヤ名 */
        layerNameDrainPipe: "DRAIN_PIPE_WGS84",
        /** 管渠キーフィールド */
        fieldNameDrainPipeKey: "SEQNO",
        /** 人孔レイヤ名 */
        layerNameManhole: "MANHOLE_WGS84",
        /** 人孔キーフィールド */
        fieldNameManholeKey: "SEQNO",
        /** 管径 */
        fieldNameDiameterW: "DIAMETER_W",
        /** 区間延長 */
        fieldNameSecDist: "SEC_DIST",
        /** 施工年度 */
        fieldNameConstYear: "CONST_YEAR",
        /** 処理区 */
        fieldNameArea: "TR_AREA",
        /** 設定処理区 */
        fieldNameAreaNames: [
            { Name: "中部処理区", Value: 3 },
            { Name: "大塩処理区", Value: 1 },
            { Name: "東部処理区", Value: 2 },
            { Name: "揖保川処理区", Value: 7 },
            { Name: "夢前処理区", Value: 8 },
            { Name: "香寺処理区", Value: 9 },
            { Name: "安富処理区", Value: 10 },
            { Name: "家島処理区", Value: 11 },
            { Name: "-", Value: 0 },
        ],

        /** 地下階数 */
        fieldNameBldgStoreysAboveGround: "bldg_storeysAboveGround",
        /** 地上階数 */
        fieldNameBldgStoreysBelowGround: "bldg_storeysBelowGround",
        /** 計測高さ */
        fieldNameBldgMeasuredHeight: "bldg_measuredHeight",
        /** 建物用途 */
        fieldNameBldgUsage: "bldg_usage",
        /** 管種 */
        fieldNameMaterial: "MATERIAL",
        /** 口径 */
        fieldNameDiameter: "DIAMETER",
        /** 分類 */
        fieldNameFclass: "FCLASS",
        /** 深さ */
        fieldNameDepth: "DEPTH",

        /** 3D管渠の幅(垂直) */
        fieldName3dGaikeiH: "GAIKEI_H",
        /** 3D管渠の幅(水平) */
        fieldName3dGaikeiW: "GAIKEI_W ",
        /** 3D人孔の深さ(南北方向) */
        fieldName3dGaikeiS: "GAIKEI_S",
        /** 3D人孔の幅(東西方向) */
        fieldName3dGaikeiL: "GAIKEI_L",
        /** 3D人孔の高さ */
        fieldName3dDepth: "DEPTH",
        /** 3D人孔の回転(東が0度で反時計回り) */
        fieldName3dAngle: "ANGLE",
    },
    /** ステータス */
    state: {
        /** 処理区 */
        chiku: null,
        /** 検索対象(空調/給湯) */
        heatType: null,
        /** レポート作成用データ */
        reportData: {
            /** 選択済み家屋キー */
            selectedBuildingKey: null,
            /** 建物用途 */
            youto: null,
            /** 延床面積 */
            nobeyuka: null,
            /** 熱需要量(ReHeatDem3かReHeatDem4※heatTypeの選択により変更) */
            reHeatDem: null,
            /** 選択済み管渠キー */
            selectedDrainPipeKey: null,
            /** 口径（幅） */
            diameterW: null,
            /** 区間距離 */
            secDist: null,
            /** 熱ポテンシャル(夏) */
            potentialS: null,
            /** 熱ポテンシャル(冬) */
            potentialW: null,
            /** 熱ポテンシャル(年間) */
            potentialY: null,
            /** 施工年度 */
            constYear: null,
            /** 選択済み管渠の中心 */
            selectedDrainPipeCenter: null,
            /** 2Dヒートポンプ */
            heatPumpPolygon: null,
            /** ヒートポンプサイズ(フォーマット：○○○*○○○*○○○) */
            heatPumpSizeStr: null,
            /** ヒートポンプ幅(mm) */
            heatPumpWidth: null,
            /** ヒートポンプ奥行(mm) */
            heatPumpDepth: null,
            /** ヒートポンプ高さ(mm) */
            heatPumpHight: null,
            /** 配管の延長 */
            pipeLength: null,
        },
    },
    /** 定数 */
    constants: {
        /** 最大ズームレベル */
        maxZoom: 22,
        /** 最小ズームレベル */
        minZoom: 14,
        /** (ライン)採熱経路-レイヤ名 */
        graphicLineLayerName: "Graphic_Line",
        /** (ライン)採熱経路-色 */
        graphicLineColor: "red",
        /** (ライン)採熱経路-太さ */
        graphicLineWidth: 3,
        /** (テキスト)採熱経路-レイヤ名 */
        graphicTextLayerName: "Graphic_Text",
        /** (テキスト)採熱経路-色 */
        graphicTextColor: "red",
        /** (テキスト)採熱経路-サイズ */
        graphicTextSize: 12,
        /** (テキスト)採熱経路-オフセット */
        graphicTextOffset: 8,
        /** (テキスト)マッチング結果-色 */
        labelTextColor: "red",
        /** (テキスト)マッチング結果-サイズ */
        labelTextSize: 9,
        /** (テキスト)マッチング結果-表示スケール *最大ズームアウト */
        labelMinScale: 5000,
        /** (テキスト)マッチング結果-表示スケール *最小ズームイン */
        labelMaxScale: 0,
        /** (2Dポリゴン)ヒートポンプ-レイヤ名 */
        heatPumpLayerName: "Graphic_Cube",
        /** ハイライト(枠線)の透過度 ※Arcデフォルトは 1 */
        highlightHaloOpacity: 0.5,
        /** ハイライト(塗りつぶし)の透過度 ※Arcデフォルトは 0.25 */
        highlightFillOpacity: 0.2,
        /** (Scene)地表-透過度 */
        sceneGroundOpacity: 0.6,
        /** (Scene)レイヤ-表示スケール *最大ズームアウト  */
        sceneLayerMinScale: 30000,
        /** (Scene)レイヤ-表示スケール *最小ズームイン  */
        sceneLayerMaxScale: 0,
        /** (Scene)管渠-色 */
        sceneDrainPipeColor: "blue",
        /** (Scene)人孔-色 */
        sceneManholeColor: "red",
        /** (Scene)ヒートポンプ-色 */
        sceneHeatPumpColor: "rgb(255, 204, 255)",
        /** (Scene)ヒートポンプ-アウトライン色 */
        sceneHeatPumpOutlineColor: "black",
    },
    /** Queryした結果に含める参照フィールド */
    queryOutFields: {
        /** 家屋(lod0) */
        buildingLod0: {
            /** OBJECTID */
            OBJECTID: "OBJECTID",
            /** gen_建物ID */
            SEQNO: null,
            /** 延床面積格納 */
            Nobeyuka: "Nobeyuka",
            /** 正確な熱需要格納(空調) */
            ReHeatDem3: "ReHeatDem3",
            /** 正確な熱需要格納(給湯) */
            ReHeatDem4: "ReHeatDem4",
            /** 関連管渠キー（修正） */
            TmpKankyoKey: "tmpKankyoKey",
            /** 統合した建物用途 */
            NewYouto: "NewYouto",
            /** 処理区 */
            TR_AREA: null,
        },
        /** 管渠 */
        drainPipe: {
            /** OBJECTID */
            OBJECTID: "OBJECTID",
            /** SEQNO */
            SEQNO: null,
            /** 区間距離 */
            SEC_DIST: null,
            /** 口径（幅） */
            DIAMETER_W: null,
            /** 施工年度 */
            CONST_YEAR: null,
            /** 処理区 */
            TR_AREA: null,
            /** ポテンシャル値(夏) */
            Potential_S: "Potential_S",
            /** ポテンシャル値(冬) */
            Potential_W: "Potential_W",
            /** ポテンシャル値(年間) */
            Potential_Y: "Potential_Y"
        },
        /** 人孔 */
        manhole: {
            /** OBJECTID */
            OBJECTID: "OBJECTID",
            /** SEQNO */
            SEQNO: null, 
            /** 処理区 */
            TR_AREA: null,
            /** ポテンシャル値(夏) */
            Potential_S: "Potential_S",
            /** ポテンシャル値(冬) */
            Potential_W: "Potential_W",
            /** ポテンシャル値(年間) */
            Potential_Y: "Potential_Y"
        }
    },
    /** ポップアップで表示するフィールド */
    popupFields: {
        /** 家屋(lod0) */
        buildingLod0: {
            /** 延床面積 */
            Nobeyuka: "Nobeyuka",
            /** 地下階数 */
            bldg_storeysAboveGround: null,
            /** 地上階数 */
            bldg_storeysBelowGround: null,
            /** 計測高さ */
            bldg_measuredHeight: null,
            /** 建物用途 */
            bldg_usage: null,
            /** 熱需要値(冷房) */
            HeatDemand1: "HeatDemand1",
            /** 熱需要値(暖房) */
            HeatDemand2: "HeatDemand2",
            /** 熱需要値(空調) */
            HeatDemand3: "HeatDemand3",
            /** 熱需要値(給湯) */
            HeatDemand4: "HeatDemand4",
            /** 正確な熱需要格納(空調) */
            ReHeatDem3: "ReHeatDem3",
            /** 正確な熱需要格納(給湯) */
            ReHeatDem4: "ReHeatDem4",
        },
        /** 管渠 */
        drainPipe: {
            /** 管種 */
            MATERIAL: null,
            /** 区間距離 */
            SEC_DIST: null,
            /** 口径 */
            DIAMETER: null,
            /** ポテンシャル値(夏) */
            Potential_S: "Potential_S",
            /** ポテンシャル値(冬) */
            Potential_W: "Potential_W",
            /** ポテンシャル値(年間) */
            Potential_Y: "Potential_Y"
        },
        /** 人孔 */
        manhole: {
            /** 分類 */
            FCLASS: null,
            /** 深さ */
            DEPTH: null,
            /** ポテンシャル値(夏) */
            Potential_S: "Potential_S",
            /** ポテンシャル値(冬) */
            Potential_W: "Potential_W",
            /** ポテンシャル値(年間) */
            Potential_Y: "Potential_Y"
        }
    },
    initialize: function () {
        const settings = this.settings;
        this.queryOutFields.buildingLod0.SEQNO = settings.fieldNameBuildingKey;
        this.queryOutFields.buildingLod0.TR_AREA = settings.fieldNameArea;
        this.queryOutFields.drainPipe.SEQNO = settings.fieldNameDrainPipeKey;
        this.queryOutFields.drainPipe.SEC_DIST = settings.fieldNameSecDist;
        this.queryOutFields.drainPipe.DIAMETER_W = settings.fieldNameDiameterW;
        this.queryOutFields.drainPipe.CONST_YEAR = settings.fieldNameConstYear;
        this.queryOutFields.drainPipe.TR_AREA = settings.fieldNameArea;
        this.queryOutFields.manhole.SEQNO = settings.fieldNameManholeKey;
        this.queryOutFields.manhole.TR_AREA = settings.fieldNameArea;

        this.popupFields.buildingLod0.bldg_storeysAboveGround = settings.fieldNameBldgStoreysAboveGround;
        this.popupFields.buildingLod0.bldg_storeysBelowGround = settings.fieldNameBldgStoreysBelowGround;
        this.popupFields.buildingLod0.bldg_measuredHeight = settings.fieldNameBldgMeasuredHeight;
        this.popupFields.buildingLod0.bldg_usage = settings.fieldNameBldgUsage;
        this.popupFields.drainPipe.MATERIAL = settings.fieldNameMaterial;
        this.popupFields.drainPipe.SEC_DIST = settings.fieldNameSecDist;
        this.popupFields.drainPipe.DIAMETER = settings.fieldNameDiameter;
        this.popupFields.manhole.FCLASS = settings.fieldNameFclass;
        this.popupFields.manhole.DEPTH = settings.fieldNameDepth;
    }
};
AppSettings.initialize();

export { AppSettings };