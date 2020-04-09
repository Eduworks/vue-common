global.jsonld = require('jsonld');

var lodeState = {
    state: {
        schemata: {},
        schemataLookup: {},
        rawSchemata: {},
        schemaFallback: {},
        objectModel: {},
        competencySearchModalOpen: false,
        copyOrLink: false
    },
    mutations: {
        schemata(state, schema) {
            state.schemata[schema.id] = schema.obj;
            if (EcArray.isArray(schema.obj)) {
                state.schemataLookup[schema.id] = {};
                for (var i = 0; i < schema.obj.length; i++) {
                    let scheme = schema.obj[i];
                    state.schemataLookup[schema.id][schema.obj[i]["@id"]] = schema.obj[i];
                    if (scheme["http://schema.org/domainIncludes"] != null) {
                        for (var domainType of scheme["http://schema.org/domainIncludes"]) {
                            if (state.objectModel[domainType["@id"]] == null) {
                                state.objectModel[domainType["@id"]] = {};
                            }
                            let om = state.objectModel[domainType["@id"]];
                            om[scheme["@id"]] = scheme;
                        }
                    }
                }
            }
        },
        rawSchemata(state, schema) {
            state.rawSchemata[schema.id] = schema.obj;
        },
        schemaFallback(state, schema) {
            for (var i = 0; i < schema.length; i++) {
                let scheme = schema[i];
                state.schemaFallback[scheme["@id"]] = schema[i];
                if (scheme["http://schema.org/domainIncludes"] != null) {
                    for (var domainType of scheme["http://schema.org/domainIncludes"]) {
                        if (state.objectModel[domainType["@id"]] == null) {
                            state.objectModel[domainType["@id"]] = {};
                        }
                        let om = state.objectModel[domainType["@id"]];
                        om[scheme["@id"]] = scheme;
                    }
                }
            }
        },
        competencySearchModalOpen(state, bool) {
            state.competencySearchModalOpen = bool;
        },
        copyOrLink(state, bool) {
            state.copyOrLink = bool;
        }
    },
    actions: {

    }
};

jsonld.documentLoader = function(url, callback) {
    if (url in lodeState.state.rawSchemata) {
        return callback(
            null, {
                contextUrl: null, // this is for a context via a link header
                document: lodeState.state.rawSchemata[url], // this is the actual document that was loaded
                documentUrl: url // this is the actual context URL after redirects
            });
    } else {
        var context;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                context = JSON.parse(this.responseText);
                lodeState.state.rawSchemata[url] = context;
            }
        };
        xmlhttp.open("GET", url, false);
        xmlhttp.setRequestHeader("Accept", "application/json");
        xmlhttp.send();
        return callback(
            null, {
                contextUrl: null, // this is for a context via a link header
                document: context, // this is the actual document that was loaded
                documentUrl: url // this is the actual context URL after redirects
            });
    }
};

export default lodeState;