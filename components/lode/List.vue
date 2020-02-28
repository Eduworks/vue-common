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
        <div>
            <ul class="list-ul">
                <li
                    v-for="(item) in results"
                    :key="item.id"
                    @click="click(item)">
                    <Thing
                        :obj="item"
                        :profile="profile"
                        :parentNotEditable="disallowEdits">
                        <template v-slot:frameworkTags>
                            <slot
                                name="frameworkTags"
                                :item="item" />
                        </template>
                    </Thing>
                </li>
            </ul>
            <div
                v-infinite-scroll="loadMore"
                infinite-scroll-disabled="busy"
                infinite-scroll-distance="10"
                infinite-scroll-immediate-check="false" />
        </div>
    </div>
</template>

<script>
import Thing from './Thing.vue';
export default {
    name: 'List',
    props: {
        type: String,
        repo: Object,
        profile: Object,
        click: Function,
        searchOptions: String,
        paramObj: Object,
        disallowEdits: Boolean
    },
    components: {Thing},
    created: function() {
        this.$nextTick(() => this.searchRepo());
    },
    data: function() {
        return {
            search: "",
            results: [],
            busy: false,
            start: 0
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
        searchRepo: function() {
            var me = this;
            this.start = 0;
            this.results.splice(0, this.results.length);
            var search = "(@type:" + this.type + " AND \"" + this.search + "\")" + this.searchOptions;
            if (this.search.length === 0) {
                search = "@type:" + this.type + this.searchOptions;
            }
            var paramObj = null;
            if (this.paramObj) {
                paramObj = Object.assign({}, this.paramObj);
            }
            this.repo.searchWithParams(search, paramObj, function(result) {
                me.results.push(result);
            }, function(results) {

            }, console.error);
        },
        loadMore: function() {
            if (this.paramObj) {
                this.busy = true;
                var me = this;
                var localParamObj = Object.assign({}, this.paramObj);
                this.start += this.paramObj.size;
                localParamObj.start = this.start;
                var search = "(@type:" + this.type + " AND \"" + this.search + "\")" + this.searchOptions;
                this.repo.searchWithParams(search, localParamObj, function(result) {
                    me.results.push(result);
                }, function(results) {
                    me.busy = false;
                }, function(err) {
                    console.error(err);
                    me.busy = false;
                });
            }
        }
    }
};
</script>