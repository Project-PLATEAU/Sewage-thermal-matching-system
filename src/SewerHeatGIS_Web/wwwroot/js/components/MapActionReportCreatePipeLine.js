import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";
import { MapSketchViewModel } from "./MapSketchViewModel.js";

/** 採熱経路作成 */
class CreatePipeLineAction {
    constructor() {
        /** 「採熱経路作成」ボタン */
        this.elem = document.getElementById("createPipeLineAction");
    }

    /** 採熱経路作成の初期化
     *    -  「採熱経路作成」ボタンクリック
     *    -  描画ツールを実行 */
    initializeAction() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        this.elem.addEventListener("click", function () {
            const currentActionName = MapObj.currentAction?.name;
            MapObj.endAction();
            if (currentActionName === this.id) {
                return; // もう一度ボタンをクリックした場合は解除する。
            }

            if (MapObj.sketchViewModel.layer.graphics.length > 0) {
                MapSketchViewModel.clearSketchViewModel();
            }
            MapObj.sketchViewModel.create("polyline");

            const endActionFunction = () => {
                if (MapObj.sketchViewModel.layer.graphics.length > 0) {
                    // 位置変更中にモード終了した場合は削除する。
                    MapObj.sketchViewModel.delete(); // update中のsketchのみ削除される。
                } else {
                    MapObj.sketchViewModel.cancel();
                }
            };
            MapObj.setAction(this.id, endActionFunction);
        });
    }

    /** 初期化 */
    initialize() {
        this.initializeAction();
    }
};

/** 採熱経路作成(ActionTool) */
const MapActionReportCreatePipeLine = new CreatePipeLineAction();
export { MapActionReportCreatePipeLine };