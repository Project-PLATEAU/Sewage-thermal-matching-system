using ArcGIS.Desktop.Core.Geoprocessing;
using ArcGIS.Desktop.Framework;
using ArcGIS.Desktop.Framework.Threading.Tasks;
using ArcGIS.Desktop.Mapping;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace SewerHeatGIS_ProAppModule.Views
{
    public class ThermalPotentialCalculationViewModel : INotifyPropertyChanged
    {
        private readonly string _WindwoName = "ポテンシャル計算";
        public event EventHandler ClosingRequest;
        public event PropertyChangedEventHandler PropertyChanged = delegate { };
        private RelayCommand _SelectFileCommand = null;
        private RelayCommand _ExecuteCommand = null;
        private RelayCommand _CloseCommand = null;
        private string _FilePath = "";
        private string _StatusMessage = "";
        public bool closed { get; set; } = false;
        protected virtual void NotifyPropertyChanged([CallerMemberName] string propertyName = null)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(propertyName));
            }
        }
        public ThermalPotentialCalculationViewModel()
        {
            _SelectFileCommand = new RelayCommand(() => OnSelectFile());
            _ExecuteCommand = new RelayCommand(OnExecute);
            _CloseCommand = new RelayCommand(OnClose);
        }

        /// <summary>
        /// 設定ファイルパス
        /// </summary>
        public string FilePath
        {
            get { return _FilePath; }
            set { _FilePath = value; NotifyPropertyChanged("FilePath"); }
        }

        /// <summary>
        /// 処理状況
        /// </summary>
        public string StatusMessage
        {
            get { return _StatusMessage; }
            set { _StatusMessage = value; NotifyPropertyChanged("StatusMessage"); }
        }

        /// <summary>
        /// 選択ボタンコマンド
        /// </summary>
        public ICommand SelectFile
        {
            get
            {
                return _SelectFileCommand;
            }
        }

        /// <summary>
        /// 実行ボタンコマンド
        /// </summary>
        public ICommand Execute
        {
            get
            {
                return _ExecuteCommand;
            }
        }

        /// <summary>
        /// 終了ボタンコマンド
        /// </summary>
        public ICommand Close
        {
            get
            {
                return _CloseCommand;
            }
        }
        /// <summary>
        /// 終了処理
        /// </summary>
        private void OnClose()
        {
            ClosingRequest?.Invoke(this, new EventArgs());
        }

        /// <summary>
        /// 処理状況クリア
        /// </summary>
        private void ClearTextBlock()
        {
            StatusMessage = "";
        }

        /// <summary>
        /// 処理状況更新
        /// </summary>
        /// <param name="msg"></param>
        private void UpdateTextBlock(string msg)
        {
            StatusMessage = msg;
        }

        /// <summary>
        /// 設定ファイル選択ボタンクリック
        /// </summary>
        private async void OnSelectFile()
        {
            var dialog = new OpenFileDialog();
            dialog.Filter = "テキスト文書|*.txt";

            // ダイアログを表示する
            if (dialog.ShowDialog() == true)
            {
                FilePath = dialog.FileName;

                // 選択されたファイル名 (ファイルパス) をチェックしてメッセージボックスに表示
                bool ret = await CheckSettingFile(dialog.FileName);
            }
        }

        /// <summary>
        /// ファイル内容チェック
        /// </summary>
        /// <param name="selected_file"></param>
        internal async Task<bool> CheckSettingFile(string selected_file)
        {
            //設定ファイルパスチェック
            if (!CheckSettingFilePath(selected_file))
            {
                return false;
            }

            if (await SewerHeatUtil.CheckIniFileAsync(selected_file, "ポテンシャル計算設定", _WindwoName ))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        /// <summary>
        /// 設定ファイルパスチェック
        /// </summary>
        /// <returns></returns>
        private bool CheckSettingFilePath(string path)
        {
            string msg = "";
            bool checkResult = true;
            //設定ファイルが指定されているかどうかをチェック
            if (string.IsNullOrEmpty(path) || !File.Exists(path))
            {
                checkResult = false;
                msg += "「設定ファイル」のパスが不正です。";
            }

            if (!checkResult)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, _WindwoName);
            }

            return checkResult;
        }

        /// <summary>
        /// 処理実行
        /// </summary>
        private async void OnExecute()
        {
            if (MapView.Active == null)
            {
                ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("マップを開いてください。", _WindwoName);
                return;
            }

            //設定ファイルパスチェック
            if (!await CheckSettingFile(FilePath))
            {
                return;
            }

            string procName = "ポテンシャル計算";
            MessageBoxResult ret = ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(SewerHeatUtil.confirmationMessage(procName), _WindwoName, MessageBoxButton.OKCancel, MessageBoxImage.Question, MessageBoxResult.Cancel);
            if (ret != MessageBoxResult.OK)
            {
                return;
            }

            //ポテンシャル計算実行
            ExecuteTool(procName, "CalculatePotential", new object[] { FilePath });
        }

        /// <summary>
        /// ツールボックスのスクリプトを実行する
        /// </summary>
        /// <param name="name"></param>
        /// <param name="toolname"></param>
        /// <param name="args"></param>
        private async void ExecuteTool(string name, string toolname, params object[] args)
        {
            ClearTextBlock();
            await QueuedTask.Run(async () =>
            {
                try
                {
                    // ツールボックスのパス指定
                    string toolPath = SewerHeatUtil.GetToolPath(toolname);

                    var parameters = Geoprocessing.MakeValueArray(args);
                    var environments = Geoprocessing.MakeEnvironmentArray(overwriteoutput: true);

                    System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();

                    GPExecuteToolFlags executeFlags = GPExecuteToolFlags.AddOutputsToMap
                                                      | GPExecuteToolFlags.RefreshProjectItems;

                    IGPResult gpResult = await Geoprocessing.ExecuteToolAsync(toolPath, parameters, environments, _cts.Token,
                        (event_name, o) =>
                        {
                            switch (event_name)
                            {
                                case "OnValidate":
                                    break;
                                case "OnProgressMessage":
                                    UpdateTextBlock(name + ": " + o as string);
                                    break;
                                case "OnProgressPos":
                                    break;
                                case "OnMessage":
                                    IGPMessage gpMsg = (IGPMessage)o;
                                    UpdateTextBlock(name + ": " + gpMsg.Text);
                                    break;
                                case "OnBeginExecute":
                                    break;
                                case "OnEndExecute":
                                    break;
                            }
                        },
                        executeFlags
                    );

                    string msg = "";
                    if (gpResult.IsFailed)
                    {
                        msg = "エラーが発生しました。\r\n";
                        if (gpResult.ErrorMessages.Count() > 0)
                        {
                            msg += gpResult.ErrorMessages.FirstOrDefault().Text;
                        }
                    }
                    else
                    {
                        msg = "処理を終了しました。";
                    }
                    if (!closed)
                    {
                        ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show(msg, _WindwoName);
                    }
                }
                catch (Exception exc)
                {
                    if (!closed)
                    {
                        ArcGIS.Desktop.Framework.Dialogs.MessageBox.Show("エラーが発生しました。\r\nメッセージ：\r\n" + exc.Message, _WindwoName);
                    }
                }
                finally
                {
                    ClearTextBlock();
                }
            });

        }
    }
}
