import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        schemata: {},
        rawSchemata: {},
        schemaFallback: {}
    },
    mutations: {
        schemata(state, schema) {
            state.schemata[schema.id] = schema.obj;
        },
        rawSchemata(state, schema) {
            state.rawSchemata[schema.id] = schema.obj;
        },
        schemaFallback(state, schema) {
            for (var i = 0; i < schema.length; i++) {
                state.schemaFallback[schema[i]["@id"]] = schema[i];
            }
        }
    },
    actions: {

    }
});
