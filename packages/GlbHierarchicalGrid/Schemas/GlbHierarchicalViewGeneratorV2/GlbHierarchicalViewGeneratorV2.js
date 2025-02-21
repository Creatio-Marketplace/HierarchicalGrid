define("GlbHierarchicalViewGeneratorV2", ["ViewGeneratorV2"],
	function () {
		Ext.override(Terrasoft.ViewGenerator, {
			generateGrid: function (config) {
				let profile = this.schemaProfile[config.name];
				config.hierarchical = config.hierarchical || false;
				if (profile && profile.listedConfig && profile.tiledConfig) {
					config.hierarchical = config.hierarchical || profile.isHierarchical || false;
				} else if (profile && profile.listedColumnsConfig && profile.tiledColumnsConfig) {
					config.hierarchical = config.hierarchical || profile.isHierarchical || false;
				}
				let gridConfig = this.callParent(arguments);
				return gridConfig;
			}
		});
	});