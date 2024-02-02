namespace SewerHeatGIS_Web.Models
{
    /// <summary>
    /// クライアント(地図)の設定
    /// </summary>
    public class MapOptions
    {
        /// <summary>
        /// ArcGIS Online MapのID
        /// </summary>
        public string? MapItemId { get; set; }

        /// <summary>
        /// ArcGIS Online SceneのID
        /// </summary>
        public string? SceneItemId { get; set; }
        /// <summary>
        /// 対象地域
        /// </summary>
        [ConfigurationKeyName("対象地域")]
        public string? Chiki { get; set; }
        /// <summary>
        /// 建物レイヤ名(lod0)
        /// </summary>
        [ConfigurationKeyName("建物レイヤ名(lod0)")]
        public string? LayerNameBuildingLod0 { get; set; }
        /// <summary>
        /// 建物レイヤ名(lod1)
        /// </summary>
        [ConfigurationKeyName("建物レイヤ名(lod1)")]
        public string? LayerNameBuildingLod1 { get; set; }
        /// <summary>
        /// 建物キーフィールド名
        /// </summary>
        [ConfigurationKeyName("建物キーフィールド")]
        public string? FieldNameBuildingKey { get; set; }
        /// <summary>
        /// 管渠レイヤ名
        /// </summary>
        [ConfigurationKeyName("管渠レイヤ名")]
        public string? LayerNameDrainPipe { get; set; }
        /// <summary>
        /// 管渠キーフィールド名
        /// </summary>
        [ConfigurationKeyName("管渠キーフィールド")]
        public string? FieldNameDrainPipeKey { get; set; }
        /// <summary>
        /// 人孔レイヤ名
        /// </summary>
        [ConfigurationKeyName("人孔レイヤ名")]
        public string? LayerNameManhole { get; set; }
        /// <summary>
        /// 管径フィールド名
        /// </summary>
        [ConfigurationKeyName("管径")]
        public string? FieldNameDiameter { get; set; }
        /// <summary>
        /// 区間延長フィールド名
        /// </summary>
        [ConfigurationKeyName("区間延長")]
        public string? FieldNameSecDist { get; set; }
        /// <summary>
        /// フィールド名
        /// </summary>
        [ConfigurationKeyName("施工年度")]
        public string? FieldNameConstYear { get; set; }
        /// <summary>
        /// フィールド名
        /// </summary>
        [ConfigurationKeyName("処理区")]
        public string? FieldNameArea { get; set; }
        /// <summary>
        /// フィールド名
        /// </summary>
        [ConfigurationKeyName("設定処理区")]
        public string[]? FieldNameAreaNames { get; set; }

    }
}