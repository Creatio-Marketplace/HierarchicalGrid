define("GlbHierarchicalGridUtilitiesV2", ["performancecountermanager", "ServiceHelper", "GridUtilitiesV2"],
    function (performanceManager, ServiceHelper) {
        Ext.override(Terrasoft.GridUtilities, {

            //overriden methods

            init: function () {
                this.callParent(arguments);
                this.clearExpandHierarchyLevels();
                this.setHierarchyAttributes(null);
            },


            destroy: function () {
                if (this.get("IsHierarchical")) {
                    let grid = this.getCurrentGrid();
                    if (grid) {
                        grid.un("updateExpandHierarchyLevels", this.onExpandHierarchyLevel, this);
                    }
                }
                this.callParent(arguments);
            },


            initCanLoadMoreData: function (responseCollection) {
                if (this.get("isExpandingHierarchyLevels")) {
                    this.set("isExpandingHierarchyLevels", false);
                    return;
                }
                this.callParent(arguments);
            },

            addItemsToGridData: function (dataCollection, options) {
                if (this.get("IsHierarchical")) {
                    if (!dataCollection.isEmpty()) {
                        let firstItem = dataCollection.first();
                        let parentId = firstItem.get("ParentId");
                        if (parentId) {
                            options = {
                                mode: "child",
                                target: parentId
                            };
                            let gridData = this.getGridData();
                            let parentObj = gridData.get(parentId);
                            if (parentObj) {
                                parentObj.set("HasNesting", 1);
                            }
                            if (!this.isItemExpanded(parentId)) {
                                return;
                            }
                        } else {
                            this.set("LastRecord", dataCollection.getByIndex(dataCollection.getCount() - 1));
                        }
                        this.callParent(arguments);
                        if (options && (options.mode === "child" || options.mode === "top")) {
                            let gridDataChild = this.getGridData();
                            let tempCollection = this.Ext.create("Terrasoft.Collection");
                            tempCollection.loadAll(gridDataChild);
                            gridDataChild.clear();
                            gridDataChild.loadAll(tempCollection);
                        }
                    }
                    this.set("ExpandItemId", null);
                } else {
                    this.callParent(arguments);
                }
            },

            initQueryOptions: function (esq) {
                if (this.get("IsHierarchical")) {
                    let parentItem = this.get("ExpandItemId");
                    if (!parentItem) {
                        let isClearGridData = this.get("IsClearGridData");
                        if (isClearGridData) {
                            this.clearExpandHierarchyLevels();
                        }
                        this.callParent(arguments);
                    }
                } else {
                    this.callParent(arguments);
                }
            },

            addGridDataColumns: function (esq) {
                this.callParent(arguments);
                if (this.get("IsHierarchical")) {
                    this.addParentColumnToQuery(esq);
                    this.addNestingColumnToQuery(esq);
                }
            },


            prepareResponseCollection: function (collection) {
                this.callParent(arguments);
                if (this.get("IsHierarchical")) {
                    collection.each(function (item) {
                        item.id = item.get(item.primaryColumnName);
                    });
                }
            },

            onDeleted: function (result) {
                this.callParent(arguments);
                if (result.Success && this.get("IsHierarchical")) {
                    this.reloadGridData();
                }
            },


            removeGridRecords: function (records) {
                this.callParent(arguments);
                if (this.get("IsHierarchical") && records && records.length) {
                    let updateNestingCollection = this.getParents(records);
                    let gridData = this.getGridData();
                    Terrasoft.each(updateNestingCollection, function (projectId) {
                        let count = gridData.filterByFn(function (item) {
                            return item.get("ParentId") === projectId;
                        }, this).getCount();
                        if (gridData.contains(projectId)) {
                            this.removeExpandHierarchyLevel(projectId);
                            let parent = gridData.get(projectId);
                            parent.set("HasNesting", count);
                        }
                    }, this);
                }
            },


            changeSorting: function (config) {
                if (this.get("IsHierarchical")) {
                    this.clearExpandHierarchyLevels();
                }
                this.callParent(arguments);
            },

            reloadGridColumnsConfig: function (doReRender) {
                let grid = this.getCurrentGrid();
                if (grid) {
                    let profile = this.get("Profile");
                    let propertyName = this.getDataGridName();
                    let gridProfile = propertyName ? profile[propertyName] : profile;
                    if (!Terrasoft.isEmptyObject(gridProfile) && !Ext.isEmpty(gridProfile.isHierarchical)) {
                        grid.hierarchical = grid.hierarchical || gridProfile.isHierarchical;
                    }
                }
                this.callParent(arguments);
                this.setHierarchyAttributes(null);
            },

            onExpandHierarchyLevel: function (primaryColumnValue, isExpanded) {
                if (!isExpanded || this.isItemExpanded(primaryColumnValue)) {
                    if (this.get("ExpandAllItems")) this.expandNextItem();
                    return;
                }
                this.set("IsClearGridData", false);
                this.setExpandedItem(primaryColumnValue);
                this.set("ExpandItemId", primaryColumnValue);
                this.set("isExpandingHierarchyLevels", true);
                this.loadGridData();
            },

            isItemExpanded: function (primaryColumnValue) {
                let expandedElements = this.get("expandedElements");
                return Boolean(expandedElements[primaryColumnValue]);
            },

            clearExpandHierarchyLevels: function () {
                this.set("expandedElements", {});
                this.set("expandHierarchyLevels", []);
                let grid = this.getCurrentGrid();
                if (grid) {
                    grid.expandHierarchyLevels = [];
                }
            },
            removeExpandHierarchyLevel: function (itemId) {
                let expandHierarchyLevels = this.get("expandHierarchyLevels");
                this.set("expandHierarchyLevels", Terrasoft.without(expandHierarchyLevels, itemId));
                let grid = this.getCurrentGrid();
                if (grid) {
                    grid.expandHierarchyLevels = Terrasoft.without(grid.expandHierarchyLevels, itemId);
                }
            },
            addParentColumnToQuery: function (esq) {
                let parentItem = this.get("ExpandItemId");
                let parentColumnPath = Ext.String.format("{0}.{1}", this.get("HierarchyColumnName"), this.getGridEntitySchema().primaryColumnName);
                if (parentItem && !esq.columns.contains("ParentId")) {
                    esq.addColumn(parentColumnPath, "ParentId");
                }
            },

            addNestingColumnToQuery: function (esq) {
                let columnPath = Ext.String.format("[{0}:{1}].{2}", this.getGridEntitySchema().name, this.get("HierarchyColumnName"), this.getGridEntitySchema().primaryColumnName);
                let aggregationColumn = this.Ext.create("Terrasoft.AggregationQueryColumn", {
                    aggregationType: Terrasoft.AggregationType.COUNT,
                    columnPath: columnPath
                });
                if (!esq.columns.contains("HasNesting")) {
                    esq.addColumn(aggregationColumn, "HasNesting");
                }
            },

            getParents: function (primaryValues) {
                let parentPrimaryValues = [];
                let gridData = this.getGridData();
                if (Ext.isEmpty(primaryValues)) {
                    return parentPrimaryValues;
                }
                primaryValues.forEach(function (primaryColumnValue) {
                    let project = gridData.get(primaryColumnValue);
                    let parentPrimaryColumnValue = project.get("ParentId");
                    if (parentPrimaryColumnValue) {
                        parentPrimaryValues.push(parentPrimaryColumnValue);
                    }
                });
                return parentPrimaryValues;
            },

            setExpandedItem: function (primaryColumnValue) {
                let expandedElements = this.get("expandedElements");
                (expandedElements[primaryColumnValue]) = { "page": 0 };
            },


            addHierarchyDataToProfile: function (profile) {
                let gridName = this.getDataGridName();
                profile[gridName] = profile[gridName] || {};
                profile[gridName].isHierarchical = this.get("UseHierarchy");
                profile[gridName].hierarchyParentColumnUId = this.get("HierarchyParentColumnUId");
            },

            setHierarchyAttributes: function (profile) {
                let gridProfile, columnName;
                try {
                    if (profile) {
                        gridProfile = profile[this.getDataGridName()]
                    } else {
                        if (Ext.isFunction(this.getProfile)) {
                            gridProfile = this.getProfile()[this.getDataGridName()]
                        }
                    }
                } catch (ex) {
                    this.log(Ext.String.format("Error when initializing gridProfile: {0}\n{1}", ex.message, ex.stack), Terrasoft.LogMessageType.WARNING);
                }
                if (gridProfile && gridProfile.isHierarchical) {
                    this.set("IsHierarchical", true);
                    this.set("IsHierarchyButtonsVisible", true);
                    columnName = null;
                    if (gridProfile.hierarchyParentColumnUId) {
                        Terrasoft.each(this.getGridEntitySchema().columns, function (column) {
                            if (column.uId === gridProfile.hierarchyParentColumnUId.value) {
                                columnName = column.name;
                            }
                        }, this);
                    }
                    this.set("HierarchyColumnName", columnName);
                } else {
                    this.set("IsHierarchical", false);
                    this.set("IsHierarchyButtonsVisible", false);
                    this.set("HierarchyColumnName", null);
                }
            },

            // Expand & Collapse all 

            checkNotFoundColumns: function () {
                this.callParent(arguments);
                if (this.get("ExpandAllItems")) this.expandNextItem();
            },

            expandNextItem: function () {
                this.findItemsToExpand();
                let itemsToExpand = this.getItemsArray("ItemsToExpand");
                let expandedItems = this.getItemsArray("ExpandedItems");
                let grid = this.getCurrentGrid();
                if (itemsToExpand.length > 0 && grid) {
                    let itemsToExpandId = itemsToExpand.pop();
                    expandedItems.push(itemsToExpandId);
                    grid.toggleHierarchyFolding(itemsToExpandId);
                } else {
                    this.set("ExpandAllItems", false);
                }
            },

            expandAllElements: function () {
                this.set("ExpandedItems", null);
                this.set("ExpandAllItems", true);
                this.expandNextItem();
            },


            collapseAllElements: function () {
                this.set("ExpandedItems", null);
                let grid = this.getCurrentGrid();
                if (grid) {
                    while (this.get("expandHierarchyLevels").length > 0) {
                        grid.toggleHierarchyFolding(this.get("expandHierarchyLevels")[0]);
                    }
                }
            },

            findItemsToExpand: function () {
                let grid = this.getCurrentGrid();
                let itemsToExpand = this.getItemsArray("ItemsToExpand");
                let expandedItems = this.getItemsArray("ExpandedItems");
                if (grid && itemsToExpand.length === 0) {
                    let gridData = this.getGridData();
                    if (gridData && !gridData.isEmpty()) {
                        let items = gridData.getItems();
                        Terrasoft.each(items, function (item) {
                            let primaryColumnValue = item.get(item.primaryColumnName);
                            let hasNesting = item.get("HasNesting");
                            if (hasNesting > 0 &&
                                this.get("expandHierarchyLevels").indexOf(primaryColumnValue) === -1 &&
                                itemsToExpand.indexOf(primaryColumnValue) === -1 &&
                                expandedItems.indexOf(primaryColumnValue) === -1
                            ) {
                                itemsToExpand.push(primaryColumnValue);
                            }
                        }, this);
                    }
                }
            },

            getItemsArray: function (arrayName) {
                let itemsArray = this.get(arrayName);
                if (Ext.isEmpty(itemsArray)) {
                    itemsArray = [];
                    this.set(arrayName, itemsArray);
                }
                return itemsArray;
            },


        });
    });