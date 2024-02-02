using ArcGIS.Desktop.Core.Geoprocessing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SewerHeatGIS_ProAppModule
{
    internal static class SewerHeatUtil
    {
        /// <summary>
        /// プロジェクト用ファイルパス
        /// </summary>
        private static readonly string ProjectPath = @"C:\SewerHeatGIS\ArcGisPro";

        /// <summary>
        /// ツールボックスパス
        /// </summary>
        private static readonly string ToolboxPath = System.IO.Path.Combine(ProjectPath, "SewerHeatGIS.atbx");

        /// <summary>
        /// ツールスクリプトパス
        /// </summary>
        /// <param name="pyname"></param>
        /// <returns></returns>
        public static string GetToolPath(string pyname)
        {
            return System.IO.Path.Combine(ToolboxPath, pyname);
        }

        /// <summary>
        /// 処理実行ボタン押下時の確認メッセージ
        /// </summary>
        /// <param name="procname"></param>
        /// <returns></returns>
        public static string confirmationMessage(string procname) => string.Format("{0}を実行しますがよろしいですか。\r\n" +
                                                                            "属性テーブルを開いている場合は閉じてから実行してください。", procname);

        /// <summary>
        /// ini設定ファイルをチェックする
        /// </summary>
        /// <param name="path"></param>
        /// <param name="section"></param>
        /// <param name="windwoName"></param>
        /// <returns></returns>
        public static async Task<bool> CheckIniFileAsync(string path, string section, string windwoName, bool showMsg = true)
        {
            string msg = "設定ファイルチェックエラー";
            try
            {
                bool ret = true;

                //設定ファイル形式チェック、レイヤ存在チェック
                string toolPath = SewerHeatUtil.GetToolPath("ReadSettingIniFile");
                var parameters = Geoprocessing.MakeValueArray(new object[] { path, section });
                var environments = Geoprocessing.MakeEnvironmentArray(overwriteoutput: true);

                System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();
                IGPResult gpResult = await Geoprocessing.ExecuteToolAsync(toolPath, parameters, null, null, null, GPExecuteToolFlags.None);

                if (gpResult.IsFailed)
                {
                    if (gpResult.ErrorMessages.Count() > 0)
                    {
                        msg = msg + "\r\n" + gpResult.ErrorMessages.FirstOrDefault().Text;
                    }
                    if (showMsg)
                    {
                        ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, windwoName);
                    }
                    ret = false;
                }

                return ret;
            }
            catch (Exception exc)
            {
                if (showMsg)
                {
                    ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show($"{msg}\r\nメッセージ：\r\n{exc.Message}", windwoName);
                }
                return false;
            }
        }


        /// <summary>
        /// レイヤ名のキー(設定ファイルのキー)によって指定されたレイヤの選択状態を解除する
        /// </summary>
        /// <param name="path"></param>
        /// <param name="section"></param>
        /// <param name="layerKeyName"></param>
        /// <returns></returns>
        public static async Task<bool> ClearSelectionByLayerKeyName(string path, string section, string layerKeyName)
        {
            bool ret = false;
            try
            {
                //設定ファイル形式チェック、レイヤ存在チェック
                string toolPath = SewerHeatUtil.GetToolPath("ClearSelectionByLayerKeyName");
                var parameters = Geoprocessing.MakeValueArray(new object[] { path, section, layerKeyName });
                var environments = Geoprocessing.MakeEnvironmentArray(overwriteoutput: true);

                System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();
                IGPResult gpResult = await Geoprocessing.ExecuteToolAsync(toolPath, parameters, null, null, null, GPExecuteToolFlags.None);

                return !gpResult.IsFailed;
            }
            catch (Exception exc)
            {
                return ret;
            }
        }

    }
}
