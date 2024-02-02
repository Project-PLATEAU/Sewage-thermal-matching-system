import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";
import { showAlert, showLoading, hideLoading, loadModules, convertNullToEmpty, convertNumberToFixed } from "./Utils.js";


let [print, PrintParameters, PrintTemplate] = await loadModules([
    "esri/rest/print",
    "esri/rest/support/PrintParameters",
    "esri/rest/support/PrintTemplate",
]);



/** ダウンロード */
class ReportDownloadAction {
    constructor() {

        this.excelId = "downloadExcelAction";
        this.pdfId = "downloadPdfAction";

        /** 「検討ツール作成」ボタン */
        this.downloadExcelElem = document.getElementById(this.excelId);
        /** 「調書作成」ボタン */
        this.downloadPdfElem = document.getElementById(this.pdfId);

        this.downloadExcelUrl = `${appRoot}DownloadExcelTool`;

        this.downloadPdfUrl = `${appRoot}DownloadPdfTool`;
    }

    /** レポートに必要なデータが作成済みかチェックする */
    checkReportData() {
        if (!AppSettings.state.reportData.heatPumpPolygon) {
            showAlert("「ヒートポンプ配置」を実行してください");
            return false;
        } else if (!AppSettings.state.reportData.pipeLength) {
            // 採熱経路の配管長は、未作成または未確定の状態でアラート
            if (MapObj.sketchViewModel.layer.graphics.length > 0) {
                showAlert("「採熱経路」を確定してください");
            } else {
                showAlert("「採熱経路作成」を実行してください");
            }
            return false;
        } else {
            return true;
        }
    }

    /** エクセル(検討ツール)をダウンロードする */
    async downloadExcel() {
        showLoading();

        const params = {
            Chiki: AppSettings.settings.chiki,
            HeatType: AppSettings.state.heatType,
            Youto: AppSettings.state.reportData.youto,
            Nobeyuka: AppSettings.state.reportData.nobeyuka,
            PotentialY: AppSettings.state.reportData.potentialY,
            PipeLength: AppSettings.state.reportData.pipeLength,
        }
        const urlParams = new URLSearchParams(params).toString();
        const url = this.downloadExcelUrl + "?" + urlParams;
        let fileName = "001401606.xlsm";
        await fetch(url)
            .then((result) => {
                if (!result.ok) {
                    throw new Error(result.statusText);
                }

                const header = result.headers.get('Content-Disposition');
                const parts = header.split(';');
                const downloadFileName = parts[2].split('=')[1].split("'")[2].replaceAll("\"", "");
                fileName = decodeURI(downloadFileName);

                return result.blob();
            })
            .then((blob) => {
                if (blob != null) {
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }
            })
            .catch((error) => {
                showAlert("エラーが発生しました");
                console.error(error);
            });

        hideLoading();
    }

    /** PDF(調書)をダウンロードする */
    async downloadPdf() {
        console.log("PDFダウンロード");
        showLoading();
        try {
            MapObj.graphicsSelectionLayer.visible = true;
            var org_heading = MapObj.mapView.rotation;
            MapObj.mapView.rotation = 0;

            let requestUrl = "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
            let printTask = print.execute(requestUrl, new PrintParameters({
                view: MapObj.mapView,
                template: new PrintTemplate({
                    format: "PNG32",
                    layout: "MAP_ONLY",
                    exportOptions: {
                        width:  1200,
                        height: 1200 * ((0.517751 * 210) / (0.93587 * 297))
                    },
                    scalePreserved: false,
                })
            }));

            const formData = new FormData();

            let [printResult] = await Promise.all([printTask]);
            MapObj.mapView.rotation = org_heading;

            formData.append('HeatType', AppSettings.state.heatType);
            formData.append('BuildingID', convertNullToEmpty(AppSettings.state.reportData.selectedBuildingKey));
            formData.append('BuildingYouto', convertNullToEmpty(AppSettings.state.reportData.youto));
            formData.append('BuildingNobeyuka', convertNumberToFixed(AppSettings.state.reportData.nobeyuka,2));
            formData.append('BuildingReHeatDemand', convertNumberToFixed(AppSettings.state.reportData.reHeatDem,2));
            formData.append('BuildingHeatPumpSize', convertNullToEmpty(AppSettings.state.reportData.heatPumpSizeStr));

            formData.append('PipeID', convertNullToEmpty(AppSettings.state.reportData.selectedDrainPipeKey));
            formData.append('PipeDiameter', convertNumberToFixed(AppSettings.state.reportData.diameterW,2));
            formData.append('PipeSecDist', convertNumberToFixed(AppSettings.state.reportData.secDist,2));
            formData.append('PipePotentialS', convertNumberToFixed(AppSettings.state.reportData.potentialS,2));
            formData.append('PipePotentialW', convertNumberToFixed(AppSettings.state.reportData.potentialW, 2));
            formData.append('PipePotentialY', convertNumberToFixed(AppSettings.state.reportData.potentialY, 2));
            formData.append('PipeConstYear', convertNullToEmpty(AppSettings.state.reportData.constYear));

            MapObj.graphicsSelectionLayer.visible = false;

            formData.append('Url', printResult.url);
            const request = new Request(this.downloadPdfUrl,
                {
                    method: 'POST',
                    body: formData
                })

            var fileName = 'report.pdf';
            await fetch(request).then((result) => {
                    if (!result.ok) {
                        throw new Error(result.statusText);
                    }

                    const header = result.headers.get('Content-Disposition');
                    const parts = header.split(';');
                    const downloadFileName = parts[2].split('=')[1].split("'")[2].replaceAll("\"", "");
                    fileName = decodeURI(downloadFileName);

                    return result.blob();
                })
                .then((blob) => {
                    if (blob != null) {
                        var url = window.URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }
                })
                .catch((error) => {
                    showAlert("エラーが発生しました");
                    console.error(error);
                });
        }
        finally {
            hideLoading();
        }

    }

    /** Excelダウンロードの初期化
     *    -  「検討ツール作成」ボタンクリックで起動 */
    initializeActionExcel() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        this.downloadExcelElem.addEventListener("click", async function () {
            MapObj.endAction();

            if (!self.checkReportData()) {
                return;
            }

            const endActionFunction = () => {
            };
            MapObj.setAction(self.excelId, endActionFunction);

            await self.downloadExcel();

            // ダウンロード完了後にActionを終了させる。
            MapObj.endAction();
        });
    }

    /** Pdfダウンロードの初期化
     *    -  「調書作成」ボタンクリックで起動 */
    initializeActionPdf() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        this.downloadPdfElem.addEventListener("click", async () => {
            MapObj.endAction();

            if (!self.checkReportData()) {
                return;
            }

            const endActionFunction = () => {
            };
            MapObj.setAction(self.pdfId, endActionFunction);

            let result = await this.downloadPdf();

            // ダウンロード完了後にActionを終了させる。
            MapObj.endAction();
        });
    }

    /** 初期化 */
    initialize() {
        this.initializeActionExcel();
        this.initializeActionPdf();
    }
};

/** 検討ツール・調書作成(ActionCommand) */
const MapActionReportDownload = new ReportDownloadAction();

export { MapActionReportDownload };