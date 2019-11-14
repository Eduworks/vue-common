<template>
    <div class="e-Hierarchy">
        <ul
            class="e-Hierarchy-ul"
            v-if="hierarchy">
            <HierarchyNode
                v-for="item in hierarchy"
                :key="item.obj.id"
                :obj="item.obj"
                :canEdit="canEdit"
                :hasChild="item.children"
                :profile="profile" />
        </ul>
    </div>
</template>
<script>
import HierarchyNode from './HierarchyNode.vue';
export default {
    name: 'Hierarchy',
    props: {
        container: Object,
        containerType: String,
        containerNodeProperty: String,
        containerEdgeProperty: String,
        nodeType: String,
        edgeType: String,
        edgeRelationProperty: String,
        edgeSourceProperty: String,
        edgeTargetProperty: String,
        edgeRelationLiteral: String,
        canEdit: Boolean,
        repo: Object,
        profile: Object
    },
    data: function() {
        return {
            structure: [],
            once: true
        };
    },
    components: {HierarchyNode},
    computed: {
        hierarchy: function() {
            var me = this;
            if (this.container == null) return null;
            if (!this.once) return this.structure;
            var precache = [];
            if (this.container[this.containerNodeProperty] != null) { precache = precache.concat(this.container[this.containerNodeProperty]); }
            if (this.container[this.containerEdgeProperty] != null) { precache = precache.concat(this.container[this.containerEdgeProperty]); }
            this.repo.multiget(precache, function(success) {
                var r = {};
                var top = {};
                if (me.container == null) { return r; }
                if (me.container[me.containerNodeProperty] !== null) {
                    for (var i = 0; i < me.container[me.containerNodeProperty].length; i++) {
                        var c = EcCompetency.getBlocking(me.container[me.containerNodeProperty][i]);
                        if (c !== null) { r[me.container[me.containerNodeProperty][i]] = r[c.shortId()] = top[c.shortId()] = c; }
                    }
                }
                if (me.container[me.containerEdgeProperty] != null) {
                    for (var i = 0; i < me.container[me.containerEdgeProperty].length; i++) {
                        var a = null;
                        a = EcAlignment.getBlocking(me.container[me.containerEdgeProperty][i]);
                        if (a != null) {
                            if (a[me.edgeRelationProperty] === me.edgeRelationLiteral) {
                                if (r[a[me.edgeTargetProperty]] == null) continue;
                                if (r[a[me.edgeSourceProperty]] == null) continue;
                                if (r[a[me.edgeTargetProperty]]._children == null) { r[a[me.edgeTargetProperty]]._children = []; }
                                r[a[me.edgeTargetProperty]]._children.push(r[a[me.edgeSourceProperty]]);
                                delete top[a[me.edgeSourceProperty]];
                            }
                        }
                    }
                }
                if (me.container[me.containerNodeProperty] != null) {
                    for (var i = 0; i < me.container[me.containerNodeProperty].length; i++) {
                        if (r[me.container[me.containerNodeProperty][i]]._children == null) continue;
                        r[me.container[me.containerNodeProperty][i]]._children.sort(function(a, b) {
                            return me.container[me.containerNodeProperty].indexOf(a.shortId()) - me.container[me.containerNodeProperty].indexOf(b.shortId());
                        });
                    }
                }
                me.structure.splice(0, me.structure.length);
                var keys = EcObject.keys(top);
                if (me.startingSpotUri != null) { me.structure.push(r[me.startingSpotUri]); } else {
                    for (var i = 0; i < keys.length; i++) { me.structure.push(top[keys[i]]); }
                }
                me.structure.sort(function(a, b) {
                    return me.container[me.containerNodeProperty].indexOf(a.shortId()) - me.container[me.containerNodeProperty].indexOf(b.shortId());
                });
                me.packChildren(me.structure);
                me.once = false;
            }, console.error, console.log);
            return this.structure;
        }
    },
    methods: {
        packChildren: function(item) {
            if (item == null) return;
            for (var i = 0; i < item.length; i++) {
                item[i] = {obj: item[i], children: item[i]._children};
                delete item[i].obj._children;
            }
            for (var i = 0; i < item.length; i++) {
                this.packChildren(item[i].children);
            }
        }
    }
};
</script>