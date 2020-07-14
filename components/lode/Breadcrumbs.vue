<template>
    <nav
        class="breadcrumb is-small is-info"
        aria-label="breadcrumbs">
        <ul
            v-for="framework in breadCrumbInfo"
            :key="framework.id">
            <li><a :title="framework.title"> {{ framework.shortName }}</a></li>
            <li
                v-for="each in parentBreadCrumbInfo[framework.id]"
                :key="each">
                <a :title="each.title"> {{ each.shortName }}</a>
            </li>
            <li
                v-for="each in parentConcepts"
                :key="each">
                <a>{{ getName(each) }}</a>
            </li>
        </ul>
    </nav>
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
            parentConcepts: [],
            frameworkGraph: new EcFrameworkGraph()
        };
    },
    computed: {
        parentBreadCrumbInfo: function() {
            let me = this;
            if (this.parentCompetencies === {}) {
                return;
            }
            let info = this.parentCompetencies;
            let newInfo = {};
            for (const property in info) {
                let item = info[property];
                newInfo[property] = [];
                for (let i = 0; i < item.length; i++) {
                    newInfo[property][i] = {};
                    let name = '';
                    let shortName = '';
                    let title = '';
                    if (item[i] === '...') {
                        name = item[i];
                        // title = "Competency is not at top level of framework ...";
                        shortName = item[i];
                    } else if (i < item.length - 1) {
                        name = "...";
                        title = item[i].name;
                        shortName = "...";
                    } else {
                        let id = item[i].id;
                        name = item[i].name;
                        if (name.length > 29) {
                            shortName = name.substr(0, 29);
                        } else {
                            shortName = name;
                        }
                        title = name;
                    }
                    let crumb = {
                        name: name,
                        shortName: shortName,
                        title: title
                    };
                    newInfo[property][i] = crumb;
                }
            }
            return newInfo;
        },
        breadCrumbInfo: function() {
            let info = [];
            let me = this;
            for (let i = 0; i < me.frameworks.length; i++) {
                info.push({});
                let name = me.getName(me.frameworks[i]);
                let title;
                if (name === '...') {
                    // title = "Competency is not at top level of framework...";
                } else {
                    title = name;
                }
                info[i].name = name;
                if (name.length > 29) {
                    info[i].shortName = name.substr(0, 29) + '...';
                } else {
                    info[i].shortName = name;
                }
                info[i].title = title;
                info[i].id = me.frameworks[i].id;
            }
            return info;
        }
    },
    created: function() {
        if (this.competency.type === "Competency") {
            this.searchFrameworks();
        } else {
            this.findConceptTrail(this.competency);
        }
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
                appError(failure);
                me.frameworks = [];
            }, null);
        },
        computeParentCompetencies: function() {
            var me = this;
            for (var i = 0; i < this.frameworks.length; i++) {
                var frameworkId = this.frameworks[i].id;
                this.$set(this.parentCompetencies, frameworkId, []);
                if (this.frameworks[i].competency && this.frameworks[i].competency.length > 500) {
                    me.parentCompetencies[frameworkId].push("...");
                } else {
                    this.frameworkGraph.addFramework(this.frameworks[i], this.repo, function(success) {
                        var parents = [];
                        me.getParents(me.competency.id, parents, function() {
                            for (var j = 0; j < parents.length; j++) {
                                me.parentCompetencies[frameworkId].push(parents[j]);
                            }
                        });
                    }, function(failure) {
                        appError(failure);
                    });
                }
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
        },
        findConceptTrail: function(concept) {
            if (concept["skos:topConceptOf"]) {
                var scheme = EcConceptScheme.getBlocking(concept["skos:topConceptOf"]);
                if (scheme) {
                    this.frameworks.push(scheme);
                }
            } else if (concept["skos:broader"]) {
                var parent;
                if (EcArray.isArray(concept["skos:broader"])) {
                    parent = EcConcept.getBlocking(concept["skos:broader"][0]);
                } else {
                    parent = EcConcept.getBlocking(concept["skos:broader"]);
                }
                this.parentConcepts.unshift(parent);
                this.findConceptTrail(parent);
            }
        },
        getName: function(object) {
            if (object === "...") {
                return object;
            }
            if (this.competency.type === "Competency" || this.competency.type === "Level") {
                return object.getName();
            }
            if (object["skos:prefLabel"]) {
                return Thing.getDisplayStringFrom(object["skos:prefLabel"]);
            } else if (object["dcterms:title"]) {
                return Thing.getDisplayStringFrom(object["dcterms:title"]);
            }
        }
    }
};
</script>
<style lang="scss">
.breadcrumb {
    padding-left: .0rem;
    width: 100% !important;
    font-weight: 600;
    font-size: .8rem !important;
}
.breadcrumb:not(:last-child) {
    margin-bottom: .0rem !important;
}
#arrow-icon {
    display: none;
}


</style>