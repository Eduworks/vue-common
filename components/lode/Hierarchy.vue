<template>
    <div class="e-Hierarchy">
        <ul
            class="e-Hierarchy-ul"
            v-if="hierarchy">
            <draggable
                v-model="hierarchy"
                :disabled="canEdit != true"
                :group="{ name: 'test' }"
                @start="beginDrag"
                @end="endDrag">
                <HierarchyNode
                    @mountingNode="handleMountingNode"
                    v-for="(item, index) in hierarchy"
                    :key="item.obj.id"
                    :obj="item.obj"
                    :dragging="dragging"
                    :canEdit="canEdit"
                    :hasChild="item.children"
                    :profile="profile"
                    :exportOptions="exportOptions"
                    :highlightList="highlightList"
                    :selectMode="selectMode"
                    :selectAll="selectAll"
                    :iframePath="iframePath"
                    :iframeText="iframeText"
                    :newFramework="newFramework"
                    :index="index"
                    :parentStructure="hierarchy"
                    :parent="container"
                    :containerEditable="editable"
                    @beginDrag="beginDrag"
                    @move="move"
                    @select="select"
                    @add="add"
                    @deleteObject="deleteObject"
                    @removeObject="removeObject"
                    @exportObject="exportObject">
                    <slot />
                </HierarchyNode>
            </draggable>
        </ul>
        <!--<i
            v-if="canEdit"
            class="drag-footer fa fa-plus"
            @click="add(container.shortId())" />-->
    </div>
</template>
<script>
import HierarchyNode from './HierarchyNode.vue';
import draggable from 'vuedraggable';
var hierarchyTimeout;

export default {
    name: 'Hierarchy',
    props: {
        container: Object,
        containerType: String,
        containerTypeGet: String,
        containerNodeProperty: String,
        containerEdgeProperty: String,
        nodeType: String,
        edgeType: String,
        edgeRelationProperty: String,
        edgeSourceProperty: String,
        edgeTargetProperty: String,
        edgeRelationLiteral: String,
        editable: Boolean,
        repo: Object,
        profile: Object,
        queryParams: Object,
        exportOptions: Array,
        highlightList: Array,
        selectMode: Boolean,
        selectAll: Boolean,
        iframePath: String,
        iframeText: String,
        newFramework: Boolean
    },
    data: function() {
        return {
            structure: [],
            once: true,
            dragging: false,
            controlOnStart: false
        };
    },
    components: {HierarchyNode, draggable},
    watch: {
        container: {
            handler() {
                this.once = true;
            },
            deep: true
        }
    },
    computed: {
        hierarchy: function() {
            var me = this;
            if (this.container == null) return null;
            if (!this.once) return this.structure;
            console.log("Computing hierarchy.");
            var precache = [];
            if (this.container[this.containerNodeProperty] != null) { precache = precache.concat(this.container[this.containerNodeProperty]); }
            if (this.container[this.containerEdgeProperty] != null) { precache = precache.concat(this.container[this.containerEdgeProperty]); }
            if (precache.length > 0) {
                this.repo.multiget(precache, function(success) {
                    me.computeHierarchy();
                }, console.error, console.log);
            } else {
                me.computeHierarchy();
            }
            return this.structure;
        },
        // True if the current client can edit this object.
        canEdit: function() {
            if (this.editable !== true) {
                return false;
            }
            return this.container.canEditAny(EcIdentityManager.getMyPks());
        }
    },
    methods: {
        /*
         * when a child node is mounted it emits an event
         * and a timeout is started
         */
        handleMountingNode: function() {
            this.startTime();
        },
        /*
         * each mount resets the timeout
         * if the timeout length is met (no new nodes)
         * the done loading event is triggered
         */
        startTime: function() {
            hierarchyTimeout = setTimeout(() => {
                this.$emit('doneLoadingNodes');
            }, 1000);
        },
        computeHierarchy: function() {
            var me = this;
            var r = {};
            var top = {};
            this.structure = [];
            if (this.container == null) { return r; }
            if (this.container[this.containerNodeProperty] !== null) {
                for (var i = 0; i < this.container[this.containerNodeProperty].length; i++) {
                    var c = window[this.nodeType].getBlocking(this.container[this.containerNodeProperty][i]);
                    if (c !== null) { r[this.container[this.containerNodeProperty][i]] = r[c.shortId()] = top[c.shortId()] = c; }
                }
            }
            if (this.container[this.containerEdgeProperty] != null) {
                for (var i = 0; i < this.container[this.containerEdgeProperty].length; i++) {
                    var a = null;
                    a = window[this.edgeType].getBlocking(this.container[this.containerEdgeProperty][i]);
                    if (a != null) {
                        if (a[this.edgeRelationProperty] === this.edgeRelationLiteral) {
                            if (r[a[this.edgeTargetProperty]] == null) continue;
                            if (r[a[this.edgeSourceProperty]] == null) continue;
                            if (r[a[this.edgeTargetProperty]]._children == null) { r[a[this.edgeTargetProperty]]._children = []; }
                            r[a[this.edgeTargetProperty]]._children.push(r[a[this.edgeSourceProperty]]);
                            delete top[a[this.edgeSourceProperty]];
                        }
                    } else {
                        console.log("Hierarchy: Could not find edge: " + window[this.edgeType].getBlocking(this.container[this.containerEdgeProperty][i]));
                    }
                }
            }
            if (this.container[this.containerNodeProperty] != null) {
                for (var i = 0; i < this.container[this.containerNodeProperty].length; i++) {
                    if (r[this.container[this.containerNodeProperty][i]]._children == null) continue;
                    r[this.container[this.containerNodeProperty][i]]._children.sort(function(a, b) {
                        return me.container[me.containerNodeProperty].indexOf(a.shortId()) - me.container[me.containerNodeProperty].indexOf(b.shortId());
                    });
                }
            }
            this.structure.splice(0, this.structure.length);
            var keys = EcObject.keys(top);
            if (this.startingSpotUri != null) { this.structure.push(r[this.startingSpotUri]); } else {
                for (var i = 0; i < keys.length; i++) { this.structure.push(top[keys[i]]); }
            }
            this.structure.sort(function(a, b) {
                return me.container[me.containerNodeProperty].indexOf(a.shortId()) - me.container[me.containerNodeProperty].indexOf(b.shortId());
            });
            this.packChildren(this.structure);
            this.once = false;
        },
        packChildren: function(item) {
            if (item == null) return;
            for (var i = 0; i < item.length; i++) {
                item[i] = {
                    obj: item[i],
                    children: item[i]._children === undefined ? [] : item[i]._children
                };
                delete item[i].obj._children;
            }
            for (var i = 0; i < item.length; i++) {
                this.packChildren(item[i].children);
            }
        },
        // WARNING: The Daemon of OBO lingers in these here drag and move methods. The library moves the objects, and OBO will then come get you!
        beginDrag: function() {
            this.dragging = true;
            if (event !== undefined) {
                this.controlOnStart = event.originalEvent.ctrlKey || event.originalEvent.shiftKey;
            }
        },
        endDrag: function(foo) {
            console.log(foo.oldIndex, foo.newIndex);
            var toId = null;
            var plusup = 0;
            if (foo.from.id === foo.to.id) {
                if (foo.newIndex < this.hierarchy.length) {
                    toId = this.hierarchy[foo.newIndex].obj.shortId();
                }
                plusup = 1;
            } else {
                if (foo.to.children[foo.newIndex] === undefined) {
                    toId = foo.to.id;
                } else {
                    if (foo.newIndex + 1 < foo.to.children.length) {
                        toId = foo.to.children[foo.newIndex + 1].id;
                    }
                }
            }
            this.move(
                this.hierarchy[foo.oldIndex].obj.shortId(),
                toId,
                foo.from.id,
                foo.to.id,
                !this.controlOnStart, plusup);
        },
        // fromId is the id of the object you're moving. toId is the id of the object that will be immediately below this object after the move, at the same level of hierarchy.
        move: function(fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup) {
            this.once = true;
            if (fromId !== toId) {
                var fromIndex = this.container[this.containerNodeProperty].indexOf(fromId);
                console.log(fromIndex);
                this.container[this.containerNodeProperty].splice(fromIndex, 1);
                var toIndex = null;
                if (toId == null || toId === undefined) {
                    toIndex = -1;
                } else {
                    toIndex = this.container[this.containerNodeProperty].indexOf(toId);
                }
                console.log(toIndex);
                if (plusup > 0 && fromIndex <= toIndex) { toIndex += plusup; }
                if (plusup < 0 && fromIndex < toIndex) { toIndex += plusup; }
                if (toIndex === -1) {
                    this.container[this.containerNodeProperty].push(fromId);
                } else {
                    this.container[this.containerNodeProperty].splice(toIndex, 0, fromId);
                }
            }
            if (fromContainerId !== toContainerId) {
                if (removeOldRelations === true) {
                    for (var i = 0; i < this.container[this.containerEdgeProperty].length; i++) {
                        var a = window[this.edgeType].getBlocking(this.container[this.containerEdgeProperty][i]);
                        if (a == null) { continue; }
                        if (a[this.edgeRelationProperty] === this.edgeRelationLiteral) {
                            if (a[this.edgeTargetProperty] == null) continue;
                            if (a[this.edgeSourceProperty] == null) continue;
                            if (a[this.edgeSourceProperty] !== fromId) continue;
                            console.log("Identified edge to remove: ", JSON.parse(a.toJson()));
                            this.container[this.containerEdgeProperty].splice(i--, 1);
                        }
                    }
                }
                if (toContainerId != null && toContainerId !== "") {
                    var a = new window[this.edgeType]();
                    if (EcIdentityManager.ids != null && EcIdentityManager.ids.length > 0) {
                        a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                    }
                    var source = window[this.nodeType].getBlocking(fromId);
                    var target = window[this.nodeType].getBlocking(toContainerId);
                    a.assignId(this.repo.selectedServer, EcCrypto.md5(source.shortId()) + "_" + this.edgeRelationLiteral + "_" + EcCrypto.md5(target.shortId()));
                    a.source = source.shortId();
                    a.target = target.shortId();
                    a.relationType = this.edgeRelationLiteral;
                    this.container[this.containerEdgeProperty].push(a.shortId());
                    console.log("Added edge: ", JSON.parse(a.toJson()));
                    this.repo.saveTo(a, console.log, console.error);
                }
            }
            this.repo.saveTo(this.stripEmptyArrays(this.container), console.log, console.error);
            this.dragging = false;
        },
        add: function(containerId) {
            var me = this;
            var c = new window[this.nodeType]();
            if (this.queryParams) {
                if (this.queryParams.newObjectEndpoint != null) {
                    c.generateShortId(this.queryParams.newObjectEndpoint);
                } else {
                    c.generateId(this.repo.selectedServer);
                }
            } else {
                c.generateId(this.repo.selectedServer);
            }
            if (EcIdentityManager.ids != null && EcIdentityManager.ids.length > 0) {
                c.addOwner(EcIdentityManager.ids[0].ppk.toPk());
            }
            if (!EcArray.isArray(me.container[me.containerNodeProperty])) {
                me.container[me.containerNodeProperty] = [];
            }
            this.container[this.containerNodeProperty].push(c.shortId());
            if (this.$store.state.editor && this.$store.state.editor.defaultLanguage) {
                var nodeType = this.nodeType;
                if (this.nodeType.indexOf("Ec") === 0) {
                    nodeType = this.nodeType.substring(2);
                }
                c.name = {"@language": this.$store.state.editor.defaultLanguage, "@value": "New " + nodeType};
                c["schema:dateCreated"] = new Date().toISOString();
                if (this.$store.state.editor.private === true) {
                    c = EcEncryptedValue.toEncryptedValue(c);
                }
                this.container["schema:dateModified"] = new Date().toISOString();
            }
            console.log("Added node: ", JSON.parse(c.toJson()));
            if (this.$store.state.editor) {
                this.$store.commit("newCompetency", c.shortId());
            }
            this.repo.saveTo(c, function() {
                if (containerId === me.container.shortId()) {
                    var toSave = me.container;
                    if (me.$store.state.editor && me.$store.state.editor.private === true && EcEncryptedValue.encryptOnSaveMap(me.container.id) !== true) {
                        toSave = EcEncryptedValue.toEncryptedValue(me.container);
                    }
                    me.repo.saveTo(me.stripEmptyArrays(toSave), function() {
                        me.once = true;
                    }, console.error);
                } else {
                    window[me.nodeType].get(c.id, function(node) {
                        var a = new window[me.edgeType]();
                        if (EcIdentityManager.ids != null && EcIdentityManager.ids.length > 0) {
                            a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                        }
                        var source = node;
                        var target = window[me.nodeType].getBlocking(containerId);
                        a.assignId(me.repo.selectedServer, EcCrypto.md5(source.shortId()) + "_" + me.edgeRelationLiteral + "_" + EcCrypto.md5(target.shortId()));
                        a.source = source.shortId();
                        a.target = target.shortId();
                        a.relationType = me.edgeRelationLiteral;
                        if (!EcArray.isArray(me.container[me.containerEdgeProperty])) {
                            me.container[me.containerEdgeProperty] = [];
                        }
                        me.container[me.containerEdgeProperty].push(a.shortId());
                        console.log("Added edge: ", JSON.parse(a.toJson()));
                        var toSave = me.container;
                        if (me.$store.state.editor && me.$store.state.editor.private === true) {
                            a = EcEncryptedValue.toEncryptedValue(a);
                            if (EcEncryptedValue.encryptOnSaveMap(me.container.id) !== true) {
                                toSave = EcEncryptedValue.toEncryptedValue(me.container);
                            }
                        }
                        me.repo.saveTo(a, console.log, console.error);
                        me.repo.saveTo(me.stripEmptyArrays(toSave), function() {
                            me.once = true;
                        }, console.error);
                    }, console.error);
                }
            }, console.error);
        },
        // Supports save() by removing reactify arrays.
        stripEmptyArrays(o) {
            // TODO: Investigate use of Vue.$set instead of reactification method.
            if (EcArray.isArray(o)) {
                if (o.length === 0) {
                    return null;
                }
                for (var i = 0; i < o.length; i++) {
                    o[i] = this.stripEmptyArrays(o[i]);
                    if (o[i] == null) {
                        o.splice(i--, 1);
                    }
                }
            } else if (EcObject.isObject(o)) {
                for (var key in o) {
                    var value = this.stripEmptyArrays(o[key]);
                    if (value == null) {
                        delete o[key];
                    }
                }
            }
            return o;
        },
        select: function(objId, checked) {
            this.$emit('select', objId, checked);
        },
        deleteObject: function(thing) {
            this.$emit('deleteObject', thing);
        },
        removeObject: function(thing) {
            this.$emit('removeObject', thing);
        },
        exportObject: function(thing, type) {
            this.$emit('exportObject', thing, type);
        }
    }
};
</script>