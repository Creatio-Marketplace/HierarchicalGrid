define("BaseGridDetailV2", ["ServiceHelper", "GlbHierarchicalGridUtilitiesV2", "GlbHierarchicalViewGeneratorV2"],
	function (ServiceHelper) {
		return {
			attributes: {
				"IsHierarchyButtonsVisible": {
					dataValueType: Terrasoft.DataValueType.BOOLEAN,
					value: false
				}
			},
			methods: {

				init: function () {
					this.setHierarchyAttributes(null);
					this.callParent(arguments);
				},

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
						} else {
							if (this.entitySchemaName !== this.sandbox.publish("GetEntityInfo", [], [this.sandbox.id]).entitySchemaName) {
								filters.addItem(Terrasoft.createColumnIsNullFilter(parentColumnName));
							} else {
								filters.addItem(Terrasoft.createColumnFilterWithParameter(
									Terrasoft.ComparisonType.EQUAL,
									parentColumnName,
									this.get("MasterRecordId")
								));
							}
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
				},

				/// expande & collapse all
				{
					"operation": "insert",
					"parentName": "Detail",
					"propertyName": "tools",
					"name": "expandAllElementsButton",
					"values": {
						"itemType": Terrasoft.ViewItemType.BUTTON,
						"click": {"bindTo": "expandAllElements"},
						"caption": {"bindTo": "Resources.Strings.expandAllElementsButtonCaption"},
						"visible": {"bindTo": "IsHierarchyButtonsVisible"}
					}
				},
				{
					"operation": "insert",
					"parentName": "Detail",
					"propertyName": "tools",
					"name": "collapseAllElementsButton",
					"values": {
						"itemType": Terrasoft.ViewItemType.BUTTON,
						"click": {"bindTo": "collapseAllElements"},
						"caption": {"bindTo": "Resources.Strings.collapseAllElementsButtonCaption"},
						"visible": {"bindTo": "IsHierarchyButtonsVisible"}
					}
				}
			]
		};
	}
);