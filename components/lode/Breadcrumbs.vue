<template>
    <div>
        <div
            v-for="framework in frameworks"
            :key="framework.id">
            {{ framework.getName() }}
            <span
                v-for="each in parentCompetencies[framework.id]"
                :key="each">
                {{ " > " + each.getName() }}
            </span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Breadcrumbs',
    props: {
        competency: Object
    },
    data() {
        return {
            repo: window.repo,
            frameworks: [],
            parentCompetencies: {},
            frameworkGraph: new EcFrameworkGraph()
        };
    },
    created: function() {
        this.searchFrameworks();
    },
    methods: {
        searchFrameworks: function() {
            var me = this;
            EcFramework.search(this.repo, "competency:\"" + this.competency.shortId() + "\"", function(success) {
                for (var i = 0; i < success.length; i++) {
                    me.frameworks.push(success[i]);
                }
                me.computeParentCompetencies();
            }, function(failure) {
                console.error(failure);
                me.frameworks = [];
            }, null);
        },
        computeParentCompetencies: function() {
            var me = this;
            for (var i = 0; i < this.frameworks.length; i++) {
                var frameworkId = this.frameworks[i].id;
                this.$set(this.parentCompetencies, frameworkId, []);
                this.frameworkGraph.addFramework(this.frameworks[i], this.repo, function(success) {
                    var parents = [];
                    me.getParents(me.competency.id, parents, function() {
                        for (var j = 0; j < parents.length; j++) {
                            me.parentCompetencies[frameworkId].push(parents[j]);
                        }
                    });
                }, function(failure) {
                    console.error(failure);
                });
            }
        },
        getParents: function(competencyId, parents, callback) {
            var foundAParent = false;
            var me = this;
            for (var i = 0; i < me.frameworkGraph.edges.length; i++) {
                if (me.frameworkGraph.edges[i].source.id === competencyId) {
                    var parentId = me.frameworkGraph.edges[i].destination.id;
                    parents.unshift(me.frameworkGraph.competencyMap[parentId]);
                    foundAParent = true;
                    this.getParents(parentId, parents, callback);
                    break;
                }
            }
            if (!foundAParent) {
                callback();
            }
        }
    }
};
</script>
