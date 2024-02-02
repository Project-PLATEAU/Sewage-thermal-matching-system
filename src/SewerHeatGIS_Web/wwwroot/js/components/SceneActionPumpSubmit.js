import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { SceneObj } from "./SceneObj.js";
import { customConfirm, toggleElem } from "./Utils.js";


/** 3Dヒートポンプの配置決定 */
class PumpSubmitAction {
    constructor() {
        /** 「配置決定」ボタン */
        this.elem = document.getElementById("pumpSubmitAction");
    }

    /** 3Dの配置結果を2D地図のヒートポンプに反映 */
    submit() {
        const centor = SceneObj.graphicCubeLayer.graphics.items[0].geometry.centroid;
        SceneObj.sceneView.viewpoint.targetGeometry = centor;
        AppObj.updateHeatPumpPolygon(SceneObj.graphicCubeLayer.graphics.items[0]);

        const switchBtn = document.getElementById("switchBtn");
        toggleElem(switchBtn);
        AppObj.switchView();
    }

    /** 3Dヒートポンプ位置決定の初期化
     *    -  「配置決定」ボタンクリック */
    initializeAction() {
        const submit_func = this.submit;
        this.elem.addEventListener("click", function () {
            this.blur();
            customConfirm("ヒートポンプ", "配置を決定しますか", submit_func);
        });
    }

    /** 初期化 */
    initialize() {
        this.initializeAction();
    }
};

/** 3Dヒートポンプの配置決定(ActionCommand) */
const SceneActionPumpSubmit = new PumpSubmitAction();

export { SceneActionPumpSubmit };