<template>
    <div class="List">
        <template>
            <ul class="list-ul">
                <li
                    class="list-ul__item"
                    v-for="(item) in results"
                    :key="item.id"
                    @click="click(item)">
                    <Breadcrumbs
                        v-if="selectingCompetency"
                        :competency="item" />
                    <Thing
                        :obj="item"
                        :view="view"
                        :profile="profile"
                        class="list-thing"
                        :parentNotEditable="disallowEdits">
                        <template v-slot:frameworkTags>
                            <slot
                                name="frameworkTags"
                                :item="item" />
                        </template>
                        <span
                            id="search-selection__icon"
                            v-if="selectingCompetency && isClicked(item.shortId())">
                            <div class="icon is-primary is-small">                            <i
                                class="fa fa-check has-text-primary"
                                aria-hidden="true" />
                            </div>
                        </span>
                    </Thing>
                    <div
                        id="arrow-icon"
                        class="icon has-text-primary">
                        <i class="fa fa-arrow-right" />
                    </div>
                </li>
                <!-- After the framework/concept scheme search results, show competencies/concepts -->
                <li
                    class="list-ul__item"
                    v-for="(item) in subResults"
                    :key="item.id"
                    @click="subObjectClick(item)">
                    <Breadcrumbs
                        :competency="item"
                        :ref="item.id" />
                    <Thing
                        :obj="item"
                        :view="view"
                        :profile="profile"
                        class="list-thing"
                        :parentNotEditable="disallowEdits" />
                    <div
                        id="arrow-icon"
                        class="icon has-text-primary">
                        <i class="fa fa-arrow-right" />
                    </div>
                </li>
            </ul>
            <div
                v-infinite-scroll="loadMore"
                infinite-scroll-disabled="busy"
                infinite-scroll-distance="10"
                infinite-scroll-immediate-check="false" />
        </template>
    </div>
</template>

<script>
import Thing from './Thing.vue';
import Breadcrumbs from './Breadcrumbs.vue';
export default {
    name: 'List',
    props: {
        type: String,
        repo: Object,
        profile: Object,
        click: Function,
        searchOptions: String,
        paramObj: Object,
        disallowEdits: Boolean,
        selectingCompetency: Boolean,
        selected: Array,
        displayFirst: Array,
        view: {
            type: String,
            default: ''
        }
    },
    components: {Thing, Breadcrumbs},
    created: function() {
        this.$nextTick(() => this.searchRepo());
    },
    data: function() {
        return {
            results: [],
            busy: false,
            start: 0,
            subResults: [],
            subStart: 0,
            searchFrameworks: true,
            searchCompetencies: true,
            searchingForCompetencies: false
        };
    },
    watch: {
        text: function(newValue, oldValue) {
        },
        paramObj: function() {
            this.searchRepo();
        },
        searchOptions: function() {
            this.searchRepo();
        },
        searchTerm: function(val) {
            this.searchRepo();
        },
        applySearchTo: function() {
            // Set which objects to search
            if (this.applySearchTo && this.applySearchTo.length > 0) {
                this.searchFrameworks = false;
                this.searchCompetencies = false;
                for (let i = 0; i < this.applySearchTo.length; i++) {
                    if (this.applySearchTo[i].id === "frameworkName" || this.applySearchTo[i].id === "frameworkDescription") {
                        this.searchFrameworks = true;
                    } else if (this.applySearchTo[i].id === "competencyName" || this.applySearchTo[i].id === "competencyDescription") {
                        this.searchCompetencies = true;
                    } else if (this.applySearchTo[i].id === "ownerName") {
                        this.searchFrameworks = true;
                        this.searchCompetencies = true;
                    }
                }
            } else {
                this.searchFrameworks = true;
                this.searchCompetencies = true;
            }
            this.searchRepo();
        }
    },
    computed: {
        searchTerm: function(val) {
            return this.$store.getters['app/searchTerm'];
        },
        applySearchTo: function() {
            let options = this.$store.getters['app/applySearchTo'];
            if (!options) return null;
            let filterValues = options.filter(item => item.checked === true);
            if (filterValues.length <= 0) return null;
            return filterValues;
        }
    },
    methods: {
        subObjectClick: function(item) {
            // Access framework from breadcrumbs instead of re-searching
            var frameworks = this.$refs[item.id][0].frameworks;
            if (frameworks.length > 0) {
                this.click(frameworks[0]);
            } else {
                var params = {
                    type: "noFramework",
                    title: "No framework",
                    text: "This competency is not part of a framework."
                };
                this.$modal.show(params);
            }
        },
        buildSearch: function(type) {
            var search = "";
            // Used to only add OR to query if there's already a term
            var termAdded = false;
            if (!this.applySearchTo || this.searchTerm === "") {
                search = "(@type:" + type + (this.searchTerm != null && this.searchTerm !== "" ? " AND \"" + this.searchTerm + "\"" : "") + ")" + (this.searchOptions == null ? "" : this.searchOptions);
            } else {
                search = "(@type:" + type + " AND (";
                for (let i = 0; i < this.applySearchTo.length; i++) {
                    if ((type === "Framework" && this.applySearchTo[i].id === "frameworkName") ||
                    (type === "Competency" && this.applySearchTo[i].id === "competencyName")) {
                        if (termAdded) {
                            search += " OR ";
                        }
                        search += ("name:\"" + this.searchTerm + "\"");
                        termAdded = true;
                    } else if ((type === "Framework" && this.applySearchTo[i].id === "frameworkDescription") ||
                    (type === "Competency" && this.applySearchTo[i].id === "competencyDescription")) {
                        if (termAdded) {
                            search += " OR ";
                        }
                        search += ("description:\"" + this.searchTerm + "\"");
                        termAdded = true;
                    } else if (this.applySearchTo[i].id === "ownerName") {
                        // To do
                        // termAdded = true;
                    }
                }
                search += "))" + (this.searchOptions == null ? "" : this.searchOptions);
            }
            return search;
        },
        searchRepo: function() {
            var me = this;
            this.start = 0;
            this.results.splice(0, this.results.length);
            this.subResults.splice(0, this.subResults.length);
            this.searchingForCompetencies = false;
            if (this.searchFrameworks) {
                if (this.searchTerm === "" && this.displayFirst && this.displayFirst.length > 0) {
                    this.results = this.displayFirst;
                }
                var search = me.buildSearch(this.type);
                var paramObj = null;
                if (this.paramObj) {
                    paramObj = Object.assign({}, this.paramObj);
                }
                this.repo.searchWithParams(search, paramObj, function(result) {
                    me.results.push(result);
                }, function(results) {
                    if (me.searchOptions.trim().length !== 0) {
                        search = me.buildSearch("EncryptedValue");
                        me.repo.searchWithParams(search, paramObj, function(result) {
                            // Decrypt and add to results list
                            var type = "Ec" + result.encryptedType;
                            var v = new EcEncryptedValue();
                            v.copyFrom(result);
                            var obj = new window[type]();
                            obj.copyFrom(v.decryptIntoObject());
                            me.results.push(obj);
                        }, function(results) {
                            if (results.length < 10 && me.view !== 'crosswalk' && (me.type === "Framework" || me.type === "ConceptScheme")) {
                                if (me.searchCompetencies) {
                                    me.searchForSubObjects();
                                }
                            }
                        }, console.error);
                    } else {
                        if (results.length < 10 && me.view !== 'crosswalk'&& (me.type === "Framework" || me.type === "ConceptScheme")) {
                            if (me.searchCompetencies) {
                                me.searchForSubObjects();
                            }
                        }
                    }
                }, console.error);
            }
            if (!this.searchFrameworks) {
                // Only competency fields were selected
                return this.searchForSubObjects();
            }
        },
        loadMore: function() {
            if (this.paramObj) {
                this.busy = true;
                var me = this;
                var localParamObj = Object.assign({}, this.paramObj);
                this.start += this.paramObj.size;
                localParamObj.start = this.start;
                // If we've started loading competencies and reach scroll point, load more
                var type = this.searchingForCompetencies ? "Competency" : this.type;
                var search = this.buildSearch(type);
                this.repo.searchWithParams(search, localParamObj, function(result) {
                    me.results.push(result);
                }, function(results) {
                    if (results.length === 0 && me.view !== 'crosswalk'&& (me.type === "Framework" || me.type === "ConceptScheme")) {
                        me.searchForSubObjects();
                    } else {
                        me.busy = false;
                    }
                }, function(err) {
                    console.error(err);
                    me.busy = false;
                });
            }
        },
        searchForSubObjects: function() {
            var me = this;
            this.searchingForCompetencies = true;
            var subLocalParamObj = Object.assign({}, me.paramObj);
            subLocalParamObj.start = me.subStart;
            var type = me.type === "Framework" ? "Competency" : "Concept";
            var subSearch = me.buildSearch(type);
            me.repo.searchWithParams(subSearch, subLocalParamObj, function(subResult) {
                me.subResults.push(subResult);
            }, function(subResults) {
                me.busy = false;
                me.subStart += me.paramObj.size;
            }, function(err) {
                console.error(err);
                me.busy = false;
            });
        },
        isClicked: function(id) {
            if (EcArray.has(this.selected, id)) {
                return true;
            } else {
                return false;
            }
        }
    }
};
</script>
