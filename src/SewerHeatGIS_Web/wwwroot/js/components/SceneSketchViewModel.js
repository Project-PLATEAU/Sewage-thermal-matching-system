import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { SceneObj } from "./SceneObj.js";
import { loadModules } from "./Utils.js";

let [SketchViewModel] = await loadModules([
    "esri/widgets/Sketch/SketchViewModel",
        ]);

/** 3Dスケッチ */
class SceneSketch {
    constructor() {
    }

    /** イベント追加 */
    addEventToSketchViewModel() {
        // 選択中にDeleteボタンで削除されないように対策
        SceneObj.sketchViewModel.on("delete", function (event) {
            event.graphics.forEach(function (graphic) {
                SceneObj.graphicCubeLayer.add(graphic);
            });
        });
    }

    /** スケッチ初期化 */
    initializeSketchViewModel() {
        SceneObj.scene.add(SceneObj.graphicCubeLayer);

        // 移動と回転のみ
        SceneObj.sketchViewModel = new SketchViewModel({
            view: SceneObj.sceneView,
            layer: SceneObj.graphicCubeLayer,
            defaultCreateOptions: {
                hasZ: true
            },
            defaultUpdateOptions: {
                enableZ: false,
                enableScaling: false,
                multipleSelectionEnabled: false,
                toggleToolOnClick: false
            }
        });

        this.addEventToSketchViewModel();
    }

    /** 初期化 */
    initialize() {
        this.initializeSketchViewModel();
    }
};

/** スケッチ(ヒートポンプの3Dポリゴン描画) */
const SceneSketchViewModel = new SceneSketch();

export { SceneSketchViewModel };