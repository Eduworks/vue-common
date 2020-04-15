<template>
    <div class="List">
        <!-- search field -->
        <div class="field">
            <p class="control has-icons-right">
                <input
                    class="input is-large"
                    ref="text"
                    :placeholder="'Search for '+type+'s...'"
                    v-model="search"
                    @keyup.enter="searchRepo">
                <span
                    @click="searchRepo"
                    class="icon is-small is-right">
                    <i class="fas fa-search" />
                </span>
            </p>
        </div>
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
        displayFirst: Array
    },
    components: {Thing, Breadcrumbs},
    created: function() {
        this.$nextTick(() => this.searchRepo());
    },
    data: function() {
        return {
            search: "",
            results: [],
            busy: false,
            start: 0,
            subResults: [],
            subStart: 0
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
        searchRepo: function() {
            var me = this;
            this.start = 0;
            this.results.splice(0, this.results.length);
            if (this.search === "" && this.displayFirst && this.displayFirst.length > 0) {
                this.results = this.displayFirst;
            }
            var search = "(@type:" + this.type + (this.search != null && this.search !== "" ? " AND \"" + this.search + "\"" : "") + ")" + (this.searchOptions == null ? "" : this.searchOptions);
            var paramObj = null;
            if (this.paramObj) {
                paramObj = Object.assign({}, this.paramObj);
            }
            this.repo.searchWithParams(search, paramObj, function(result) {
                me.results.push(result);
            }, function(results) {
                if (me.searchOptions.trim().length !== 0) {
                    search = "(@type:" + "EncryptedValue" + (me.search != null && me.search !== "" ? " AND \"" + me.search + "\"" : "") + ")" + (me.searchOptions == null ? "" : me.searchOptions);
                    me.repo.searchWithParams(search, paramObj, function(result) {
                        // Decrypt and add to results list
                        var type = "Ec" + result.encryptedType;
                        var v = new EcEncryptedValue();
                        v.copyFrom(result);
                        var obj = new window[type]();
                        obj.copyFrom(v.decryptIntoObject());
                        me.results.push(obj);
                    }, function(results) {
                        if (results.length === 0 && (me.type === "Framework" || me.type === "ConceptScheme")) {
                            me.searchForSubObjects();
                        }
                    }, console.error);
                } else {
                    if (results.length === 0 && (me.type === "Framework" || me.type === "ConceptScheme")) {
                        me.searchForSubObjects();
                    }
                }
            }, console.error);
        },
        loadMore: function() {
            if (this.paramObj) {
                this.busy = true;
                var me = this;
                var localParamObj = Object.assign({}, this.paramObj);
                this.start += this.paramObj.size;
                localParamObj.start = this.start;
                var search = "(@type:" + this.type + (this.search != null && this.search !== "" ? " AND \"" + this.search + "\"" : "") + ")" + (this.searchOptions == null ? "" : this.searchOptions);
                this.repo.searchWithParams(search, localParamObj, function(result) {
                    me.results.push(result);
                }, function(results) {
                    if (results.length === 0 && (me.type === "Framework" || me.type === "ConceptScheme")) {
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
            var subLocalParamObj = Object.assign({}, me.paramObj);
            subLocalParamObj.start = me.subStart;
            var type = me.type === "Framework" ? "Competency" : "Concept";
            var subSearch = "(@type:" + type + (me.search != null && me.search !== "" ? " AND \"" + me.search + "\"" : "") + ")" + (me.searchOptions == null ? "" : me.searchOptions);
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
