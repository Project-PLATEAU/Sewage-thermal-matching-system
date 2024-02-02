import { AppSettings } from "./components/AppSettings.js";
import { AppObj } from "./components/AppObj.js";
import { MapObj } from "./components/MapObj.js";
import { SceneObj } from "./components/SceneObj.js";
import { loadModules, showAlert , showLoading, hideLoading } from "./components/Utils.js";

function errorProcess(e) {
    showAlert("エラーが発生しました");
    console.error("Error occurred: ", e);
}

// グローバル例外ハンドラ(地図内)
window.onerror = errorProcess;
window.addEventListener("unhandledrejection", errorProcess);


/** ArcGISのモジュールを読み込む */
let [Portal, OAuthInfo, esriId] = await loadModules(
    ["esri/portal/Portal",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager"]);

const info = new OAuthInfo({
    appId: appId, // appId は appSetting.json で定義
    flowType: "auto", 
    popup: false
});

esriId.registerOAuthInfos([info]);
try {
    var credit = esriId.getCredential(info.portalUrl + "/sharing");
}
catch
{
    window.location.reload();
}
var portal = new Portal();
portal.authMode = "immediate";
try {
    await portal.load();
}
catch {
    // ログインキャンセルは画面再読み込み
    window.location.reload();

}

if (portal.loaded) {
    try {
        document.getElementById("mapContent").classList.remove("d-none");
        showLoading();
        await AppObj.init();
        await MapObj.init();
        await SceneObj.init();
    } finally {
        hideLoading();
    }
}