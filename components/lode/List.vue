<template>
    <div class="List">
        <div
            class="section has-text-centered"
            v-if="firstSearchProcessing">
            <span class="icon is-large">
                <i class="fa fa-spinner fa-2x fa-pulse" />
            </span>
        </div>
        <template>
            <div class="container">
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
                                class="search-selection__icon"
                                v-if="selectingCompetency && isClicked(item.shortId()) && view === 'search'">
                                <div class="icon is-primary is-small">
                                    <i
                                        class="fa fa-check has-text-primary"
                                        aria-hidden="true" />
                                </div>
                            </span>
                            <span
                                class="search-selection__add-icon"
                                v-else-if="view === 'search'&& view !== 'crosswalk'">
                                <div class="icon is-primary is-small">
                                    <i
                                        class="fa fa-plus has-text-primary"
                                        aria-hidden="true" />
                                </div>
                            </span>
                        </Thing>
                        <div
                            v-if="view !== 'search' && view !== 'crosswalk'"
                            class="icon has-text-primary arrow-icon">
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
                            v-if="view !== 'search'"
                            class="icon has-text-primary arrow-icon">
                            <i class="fa fa-arrow-right" />
                        </div>
                    </li>
                </ul>
                <infinite-loading
                    @infinite="loadMore"
                    spinner="circles"
                    v-if="results.length > 0"
                    :distance="10">
                    <div slot="no-more">
                        All results loaded
                    </div>
                    <div slot="no-results">
                        No results
                    </div>
                </infinite-loading>
            </div>
        </template>
    </div>
</template>

<script>
import Thing from './Thing.vue';
import Breadcrumbs from './Breadcrumbs.vue';
import {cassUtil} from '@/mixins/cassUtil.js';
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
        },
        filterToEditable: {
            type: Boolean,
            default: false
        }
    },
    components: {Thing, Breadcrumbs},
    mixins: [ cassUtil ],
    created: function() {
        this.$nextTick(() => this.searchRepo());
    },
    data: function() {
        return {
            results: [],
            start: 0,
            subResults: [],
            subStart: 0,
            searchFrameworks: true,
            searchCompetencies: true,
            searchingForCompetencies: false,
            applySearchToOwner: false,
            firstSearchProcessing: true,
            // To avoid duplicates
            resultIds: []
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
            this.applySearchToOwner = false;
            // Set which objects to search
            if (this.view === 'crosswalk') {
                this.searchFrameworks = true;
                this.searchCompetencies = false;
            } else if (this.applySearchTo && this.applySearchTo.length > 0) {
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
                        this.applySearchToOwner = true;
                    }
                }
            } else {
                this.searchFrameworks = true;
                this.searchCompetencies = true;
            }
            this.searchRepo();
        },
        type: function() {
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
        buildSearch: function(type, callback) {
            var search = "";
            // Used to only add OR to query if there's already a term
            var termAdded = false;
            if (!this.applySearchTo || this.searchTerm === "") {
                search = "(@type:" + type + (this.searchTerm != null && this.searchTerm !== "" ? " AND " + this.searchTerm : "") + ")" + (this.searchOptions == null || this.searchOptions === "" ? "" : this.searchOptions);
            } else {
                search = "(@type:" + type + " AND (";
                for (let i = 0; i < this.applySearchTo.length; i++) {
                    if ((type === "Framework" && this.applySearchTo[i].id === "frameworkName") ||
                    (type === "Competency" && this.applySearchTo[i].id === "competencyName")) {
                        if (termAdded) {
                            search += " OR ";
                        }
                        search += ("name:" + this.searchTerm);
                        termAdded = true;
                    } else if ((type === "Framework" && this.applySearchTo[i].id === "frameworkDescription") ||
                    (type === "Competency" && this.applySearchTo[i].id === "competencyDescription")) {
                        if (termAdded) {
                            search += " OR ";
                        }
                        search += ("description:" + this.searchTerm);
                        termAdded = true;
                    } else if (this.applySearchTo[i].id === "ownerName") {
                        let paramObj = {};
                        paramObj.size = 10;
                        let me = this;
                        EcPerson.search(window.repo, 'name:' + this.searchTerm, function(success) {
                            if (termAdded && success.length > 0) {
                                search += " OR ";
                            }
                            appLog(success);
                            for (var i = 0; i < success.length; i++) {
                                search += "\\*owner:\"" + me.getPersonEcPk(success[i]).toPem() + "\"";
                                if (i < success.length - 1) {
                                    search += " OR ";
                                }
                            }
                            EcOrganization.search(window.repo, 'name:' + me.searchTerm, function(success) {
                                appLog(success);
                                for (var i = 0; i < success.length; i++) {
                                    search += "\\*owner:\"" + me.getOrganizationEcPk(success[i]).toPem() + "\"";
                                    termAdded = true;
                                    if (i < success.length - 1) {
                                        search += " OR ";
                                    }
                                }
                                search += "))" + (me.searchOptions == null ? "" : me.searchOptions);
                                if (search.indexOf("AND ())") !== -1) {
                                    search = null;
                                }
                                callback(search);
                            }, function(failure) {
                                appError(failure);
                                callback(null);
                            }, paramObj);
                        }, function(failure) {
                            appError(failure);
                            callback(null);
                        }, paramObj);
                    }
                }
                if (!this.applySearchToOwner) {
                    search += "))" + (this.searchOptions == null ? "" : this.searchOptions);
                }
            }
            if (!this.applySearchToOwner) {
                callback(search);
            }
        },
        searchRepo: function() {
            var me = this;
            this.start = 0;
            this.results.splice(0, this.results.length);
            this.subResults.splice(0, this.subResults.length);
            this.resultIds.splice(0, this.resultIds.length);
            this.searchingForCompetencies = false;
            if (this.searchTerm === "" && this.displayFirst && this.displayFirst.length > 0) {
                for (var i = 0; i < 20; i++) {
                    this.results.push(this.displayFirst[i]);
                    this.resultIds.push(this.displayFirst[i].id);
                    this.displayFirst.shift();
                }
            }
            if (this.searchFrameworks && (this.searchTerm !== "" || !this.displayFirst || this.displayFirst.length === 0)) {
                me.buildSearch(this.type, function(search) {
                    var paramObj = null;
                    if (me.paramObj) {
                        paramObj = Object.assign({}, me.paramObj);
                    }
                    me.repo.searchWithParams(search, paramObj, function(result) {
                        if (!me.filterToEditable || (me.filterToEditable && result.canEditAny(EcIdentityManager.getMyPks()))) {
                            if (!EcArray.has(me.resultIds, result.id)) {
                                me.results.push(result);
                                me.resultIds.push(result.id);
                            }
                        }
                    }, function(results) {
                        me.firstSearchProcessing = false;
                        if (!me.applySearchTo) {
                            me.buildSearch("EncryptedValue AND \\*encryptedType:" + me.type, function(search) {
                                me.repo.searchWithParams(search, paramObj, function(result) {
                                    // Decrypt and add to results list
                                    var type = "Ec" + result.encryptedType;
                                    var v = new EcEncryptedValue();
                                    v.copyFrom(result);
                                    var obj = new window[type]();
                                    obj.copyFrom(v.decryptIntoObject());
                                    if (!EcArray.has(me.resultIds, obj.id)) {
                                        me.results.push(obj);
                                        me.resultIds.push(obj.id);
                                    }
                                }, function(results2) {
                                    if (results.length < 10 && (me.type === "Framework" || me.type === "ConceptScheme")) {
                                        if (me.searchCompetencies) {
                                            me.searchForSubObjects();
                                        }
                                    }
                                }, appError);
                            });
                        } else {
                            if (results.length < 10 && (me.type === "Framework" || me.type === "ConceptScheme")) {
                                if (me.searchCompetencies) {
                                    me.searchForSubObjects();
                                }
                            }
                        }
                    }, function(err) {
                        appError(err);
                        me.firstSearchProcessing = false;
                    });
                });
            } else {
                me.firstSearchProcessing = false;
            }
            if (!this.searchFrameworks && (this.searchTerm !== "" || !this.displayFirst || this.displayFirst.length === 0)) {
                // Only competency fields were selected
                return this.searchForSubObjects();
            }
        },
        loadMore: function($state) {
            if (this.searchTerm === "" && this.displayFirst && this.displayFirst.length > 0) {
                for (var i = 0; i < 20; i++) {
                    this.results.push(this.displayFirst[i]);
                    this.resultIds.push(this.displayFirst[i].id);
                    this.displayFirst.shift();
                }
            }
            if (this.paramObj && (this.searchTerm !== "" || !this.displayFirst || this.displayFirst.length === 0)) {
                var me = this;
                var localParamObj = Object.assign({}, this.paramObj);
                this.start += this.paramObj.size;
                localParamObj.start = this.start;
                // If we've started loading competencies and reach scroll point, load more
                var type;
                if (this.searchingForCompetencies) {
                    if (this.type === "ConceptScheme") {
                        type = "Concept";
                    } else {
                        type = "Competency";
                    }
                } else {
                    type = this.type;
                }
                this.buildSearch(type, function(search) {
                    me.repo.searchWithParams(search, localParamObj, function(result) {
                        if (!me.filterToEditable || (me.filterToEditable && result.canEditAny(EcIdentityManager.getMyPks()))) {
                            if (me.searchingForCompetencies) {
                                if (!EcArray.has(me.resultIds, result.id)) {
                                    me.subResults.push(result);
                                    me.resultIds.push(result.id);
                                }
                            } else {
                                if (!EcArray.has(me.resultIds, result.id)) {
                                    me.results.push(result);
                                    me.resultIds.push(result.id);
                                }
                            }
                        }
                    }, function(results) {
                        if (results.length === 0 && (me.type === "Framework" || me.type === "ConceptScheme")) {
                            if (me.searchCompetencies) {
                                me.searchForSubObjects($state);
                            }
                        } else if (results.length > 0) {
                            // $state references are for vue-infinite-loading component
                            $state.loaded();
                        } else {
                            $state.complete();
                        }
                    }, function(err) {
                        appError(err);
                        $state.complete();
                    });
                });
            } else {
                $state.loaded();
            }
        },
        searchForSubObjects: function($state) {
            var me = this;
            this.searchingForCompetencies = true;
            var subLocalParamObj = Object.assign({}, me.paramObj);
            subLocalParamObj.start = me.subStart;
            if (subLocalParamObj.sort.indexOf("dcterms:title") !== -1) {
                subLocalParamObj.sort = subLocalParamObj.sort.replace('dcterms:title', 'skos:prefLabel');
            }
            var type = me.type === "Framework" ? "Competency" : "Concept";
            me.buildSearch(type, function(subSearch) {
                me.repo.searchWithParams(subSearch, subLocalParamObj, function(subResult) {
                    if (!me.filterToEditable || (me.filterToEditable && subResult.canEditAny(EcIdentityManager.getMyPks()))) {
                        if (!EcArray.has(me.resultIds, subResult.id)) {
                            me.subResults.push(subResult);
                            me.resultIds.push(subResult.id);
                        }
                    }
                }, function(subResults) {
                    if (subResults.length > 0 && $state) {
                        $state.loaded();
                    } else if ($state) {
                        $state.complete();
                    }
                    me.subStart += me.paramObj.size;
                }, function(err) {
                    appError(err);
                    if ($state) {
                        $state.complete();
                    }
                });
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
