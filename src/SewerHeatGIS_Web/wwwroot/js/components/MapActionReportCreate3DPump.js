import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";
import { showAlert, showLoading, hideLoading, loadModules, customConfirm, toggleElem } from "./Utils.js";

/** ArcGISのモジュールを読み込む */
let [Polygon, Mesh] = await loadModules([
    "esri/geometry/Polygon",
    "esri/geometry/Mesh",
]);

/** ヒートポンプ配置 */
class Create3DPumpAction {
    constructor() {
        /** 「ヒートポンプ配置」ボタン */
        this.elem = document.getElementById("create3DPumpAction");

        // ヒートポンプサイズ取得URL
        this.getHeatPumpSizeURL = `${appRoot}GetHeatPumpSize`;
    }

    /** 選択中の家屋と管渠からヒートポンプを作成する */
    createHeatPump() {
        // 選択中の家屋と管渠からヒートポンプのジオメトリと配置位置を決定
        const depth = AppSettings.state.reportData.heatPumpDepth / 1000;
        const width = AppSettings.state.reportData.heatPumpWidth / 1000;
        const hight = AppSettings.state.reportData.heatPumpHight / 1000;
        const lineCenter = AppSettings.state.reportData.selectedDrainPipeCenter;
        const mesh = Mesh.createBox(lineCenter, {
            size: {
                width: width,
                depth: depth,
                hight: hight,
            },
            units: "meters",
        });

        // ヒートポンプの初期配置と地図中心を管渠のcentroidに設定
        MapObj.mapView.viewpoint.targetGeometry = lineCenter;
        MapObj.mapView.zoom = AppSettings.constants.sceneZoom;

        // AppSettingsを更新
        const polygon = Polygon.fromExtent(mesh.extent);
        AppSettings.state.reportData.heatPumpPolygon = polygon;

        AppObj.reset3dHeatPumpPosition();
    }

    /** 2D地図から生成したヒートポンプを3D地図上で表示 */
    async submit(self) {
        // サーバーからヒートポンプサイズを取得する
        if (!AppSettings.state.reportData.heatPumpSizeStr) { // 取得済みの場合は実行しない
            await self.getHeatPumpSize();
        }

        MapObj.endAction();

        self.createHeatPump();

        const switchBtn = document.getElementById("switchBtn");
        toggleElem(switchBtn);
        AppObj.switchView();

        const endActionFunction = () => {
        };
        MapObj.setAction(self.elem.id, endActionFunction);
    }

    /** ヒートポンプサイズをサーバーから取得 */
    async getHeatPumpSize() {
        showLoading();

        const params = {
            HeatType: AppSettings.state.heatType,
            HeatDemand: AppSettings.state.reportData.reHeatDem,
            Potential: AppSettings.state.reportData.potentialY,
        }
        const urlParams = new URLSearchParams(params).toString();

        const url = this.getHeatPumpSizeURL + "?" + urlParams;
        await fetch(url)
            .then((result) => {
                if (!result.ok) {
                    throw new Error(result.statusText);
                }

                return result.json();
            })
            .then((ret) => {
                var _width = ret.data.width;
                var _depth = ret.data.depth;
                var _hight = ret.data.hight;

                AppSettings.state.reportData.heatPumpSizeStr = `${_width}*${_depth}*${_hight}`;
                AppSettings.state.reportData.heatPumpWidth = _width;
                AppSettings.state.reportData.heatPumpDepth = _depth;
                AppSettings.state.reportData.heatPumpHight = _hight;

            })
            .catch((error) => {
                showAlert(`エラーが発生しました<br>
                           ヒートポンプサイズを取得できませんでした `
                );
                console.error(error);
            });

        hideLoading();
    }


    /** ヒートポンプ配置の初期化
     *    -  「ヒートポンプ配置」ボタンクリックで起動 */
    initializeAction() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        this.elem.addEventListener("click", function () {
            this.blur();
            customConfirm("ヒートポンプ", "ヒートポンプを配置しますか", self.submit, self);
        });
    }

    /** 初期化 */
    initialize() {
        this.initializeAction();
    }
};

/** ヒートポンプ配置(ActionCommand) */
const MapActionReportCreate3DPump = new Create3DPumpAction();

export { MapActionReportCreate3DPump };