<template>
    <div class="List">
        <input
            ref="text"
            v-model="search"
            @keyup.enter="searchRepo">
        <i
            class="fa fa-search"
            @click="searchRepo" />
        <ul class="list-ul">
            <li
                v-for="(item) in results"
                :key="item.id"
                @click="click(item)">
                <Thing
                    :obj="item"
                    :profile="profile" />
            </li>
        </ul>
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
        click: Function
    },
    components: {Thing},
    created: function() {
        this.$nextTick(() => this.searchRepo());
    },
    data: function() {
        return {
            search: "",
            results: []
        };
    },
    watch: {
        text: function(newValue, oldValue) {
        }
    },
    methods: {
        searchRepo: function() {
            var me = this;
            this.results.splice(0, this.results.length);
            this.repo.search("@type:" + this.type + " AND \"" + this.search + "\"", function(result) {
                me.results.push(result);
            }, function(results) {

            }, console.error);
        }
    }
};
</script>