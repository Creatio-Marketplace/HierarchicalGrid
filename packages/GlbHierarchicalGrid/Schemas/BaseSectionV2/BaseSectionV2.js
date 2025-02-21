 define("BaseSectionV2", ["ServiceHelper", "GlbHierarchicalGridUtilitiesV2", "GlbHierarchicalViewGeneratorV2"],
	function (ServiceHelper) {
		return {
			methods: {

				getFilters: function () {
					let filters = this.callParent(arguments);
					if (this.get("IsHierarchical")) {
						let parentItem = this.get("ExpandItemId");
						let parentColumnName = this.get("HierarchyColumnName");
						if (parentItem) {
							let parentFilterGroup = Terrasoft.createFilterGroup();
							parentFilterGroup.addItem(Terrasoft.createColumnFilterWithParameter(
								Terrasoft.ComparisonType.EQUAL,
								parentColumnName,
								parentItem
							));
							parentFilterGroup.addItem(filters);
							return parentFilterGroup;
						}
						else {
							filters.addItem(Terrasoft.createColumnIsNullFilter(parentColumnName));
						}
					}
					return filters;
				},

				onRender: function () {
					if (this.get("GridSettingsChanged")) {
						this.setHierarchyAttributes(null);
					}
					this.callParent(arguments);
				}
			},
			diff: [
				{
					"operation": "merge",
					"name": "DataGrid",
					"values": {
						"hierarchicalColumnName": "ParentId",
						"updateExpandHierarchyLevels": {
							"bindTo": "onExpandHierarchyLevel"
						},
						"expandHierarchyLevels": {
							"bindTo": "expandHierarchyLevels"
						}
					}
				}
			]
		};
	}
);