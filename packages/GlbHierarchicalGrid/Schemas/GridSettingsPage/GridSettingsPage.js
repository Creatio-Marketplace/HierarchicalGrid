 define("GridSettingsPage", ["GridSettingsPageResources"],
	function (resources) {
		return {
			attributes: {
				"UseHierarchy": {
					"dataValueType": Terrasoft.DataValueType.BOOLEAN,
					"onChange": "onUseHierarchyChanged",
					"value": false
				},
				"HierarchyParentColumnUId": {
					"dataValueType": Terrasoft.DataValueType.LOOKUP,
					"onChange": "onUseHierarchyChanged",
					"value": null
				},
				"HierarchyParentColumnList": {
					"dataValueType": Terrasoft.DataValueType.COLLECTION,
					"value": null
				}
			},
			methods: {

				loadProfile: function (profile) {
					this.set("IsLoadingProfile", true);
					this.setHierarchyAttributes(profile);
					let gridProfile = profile[this.getDataGridName()];
					if (gridProfile) {
						this.set("UseHierarchy", gridProfile.isHierarchical || false);
						this.set("HierarchyParentColumnUId", gridProfile.hierarchyParentColumnUId || null);
					}
					this.callParent(arguments);
					this.set("IsLoadingProfile", false);
				},

				preapareHierarchyParentColumnList: function () {
					let columns = Ext.create("Terrasoft.Collection");					
					Terrasoft.each(this.entityColumns, function (column) {
						if (column.referenceSchemaName === this.schemaName) {
							columns.add(column.uId, {
								value: column.uId,
								displayValue: column.caption
							});
						}
					}, this);
					
					this.set("HierarchyParentColumnList", columns);
				},

				onUseHierarchyChanged: function () {
					if (!this.get("IsLoadingProfile")) {
						this.reloadPreviewGridData(true);
					}
				},

				getNewProfileData: function () {
					let profile = this.callParent(arguments);
					this.addHierarchyDataToProfile(profile);
					this.setHierarchyAttributes(profile);
					return profile;
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
						}
						else {
							filters.addItem(Terrasoft.createColumnIsNullFilter(parentColumnName));
						}
					}

					return filters;
				}
			},
			diff: [
				{
					"operation": "insert",
					"parentName": "RootContentContainer",
					"propertyName": "items",
					"name": "HierarchySettingsContainer",
					"values": {
						"itemType": Terrasoft.ViewItemType.CONTAINER,
						"items": []
					}
				},
				{
					"operation": "insert",
					"parentName": "HierarchySettingsContainer",
					"propertyName": "items",
					"name": "HierarchicalSettingsGridLayout",
					"values": {
						"itemType": Terrasoft.ViewItemType.GRID_LAYOUT,
						"items": []
					}
				},
				{
					"operation": "insert",
					"parentName": "HierarchicalSettingsGridLayout",
					"propertyName": "items",
					"name": "UseHierarchy",
					"values": {
						"bindTo": "UseHierarchy",
						"caption": resources.localizableStrings.UseHierarchyCaption,
						"layout": {
							"row": 0,
							"column": 0,
							"rowSpan": 1,
							"colSpan": 8
						}
					}
				},
				{
					"operation": "insert",
					"parentName": "HierarchicalSettingsGridLayout",
					"propertyName": "items",
					"name": "HierarchyParentColumnUId",
					"values": {
						"bindTo": "HierarchyParentColumnUId",
						"contentType": Terrasoft.ContentType.ENUM,
						"visible": { "bindTo": "UseHierarchy" },
						"controlConfig": {
							"list": { "bindTo": "HierarchyParentColumnList" },
							"prepareList": { "bindTo": "preapareHierarchyParentColumnList" }
						},
						"caption": resources.localizableStrings.HierarchyParentColumnCaption,
						"layout": {
							"row": 1,
							"column": 0,
							"rowSpan": 1,
							"colSpan": 8
						}
					}
				},
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