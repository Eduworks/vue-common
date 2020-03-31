<template>
    <div class="control">
        <!-- language modifier -->
        <span
            class="select is-small"
            v-if="showLanguage">
            <!--
                not sure about this
                was a div wrapped in a menu from what I could tell
                should be a standard input, select
            -->
            <select v-model="langString">
                <option
                    v-for="(result, i) in filtered"
                    :key="i"
                    @mousedown="setLanguage(result)">
                    {{ result.display }}
                </option>
            </select>
        </span>
        <!-- timestamp -->
        <input
            v-if="range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime'"
            class="input is-small is-fullwidth date-time"
            v-model="computedText"
            type="datetime-local"
            @blur="blur">
        <span
            class="select is-large"
            v-if="options">
            <select
                v-model="computedText"
                @blur="blur">
                <option
                    v-for="item in options"
                    :key="item"
                    :value="item.val">
                    {{ item.display }}
                </option>
            </select>
        </span>
        <textarea
            v-if="!showLanguage"
            ref="textarea"
            class="textarea is-small "
            rows="1"
            v-model="computedText"
            @blur="blur" />
    </div>
</template>

<script>
const languagesFile = require('../../ietf-language-tags_json.json');
export default {
    name: 'PropertyString',
    props: {
        expandedThing: Object,
        expandedProperty: String,
        schema: Object,
        index: null,
        langString: null,
        range: null,
        options: null
    },
    created: function() {
    },
    data: function() {
        var property = this.expandedThing[this.expandedProperty];
        if (EcArray.isArray(property)) {
            return {
                text: this.expandedThing[this.expandedProperty][this.index],
                indexInternal: this.index,
                isOpen: false,
                search: "",
                languages: [],
                filtered: []
            };
        } else {
            return {
                text: this.expandedThing[this.expandedProperty],
                indexInternal: null,
                isOpen: false,
                search: "",
                languages: [],
                filtered: []
            };
        }
    },
    mounted: function() {
        this.search = this.computedLanguage;
        if (this.computedLanguage || this.langString) {
            for (var i = 0; i < languagesFile.length; i++) {
                var tag = {};
                tag.tag = languagesFile[i].subtag;
                tag.display = languagesFile[i].description;
                this.languages.push(tag);
            }
        }
    },
    computed: {
        showLanguage: function() {
            if (this.computedLanguage || this.langString) {
                return true;
            } else {
                return false;
            }
        },
        computedText: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] === undefined) {
                        return null;
                    }
                    if (this.range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime' && this.text["@value"].length > 16) {
                        return this.text["@value"].substr(0, 16);
                    }
                    return this.text["@value"];
                }
                return this.text;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] !== undefined) {
                        this.text["@value"] = value;
                    }
                } else {
                    this.text = value;
                }
            }
        },
        computedLanguage: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] === undefined) {
                        return null;
                    }
                    return this.text["@language"];
                }
                return null;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] !== undefined) {
                        this.text["@language"] = value;
                    }
                }
            }
        }
    },
    watch: {
        text: function(newValue, oldValue) {
        }
    },
    methods: {
        blur: function() {
            this.$parent.update(this.text, this.indexInternal);
            this.isOpen = false;
        },
        onSearchChange: function() {
            if (this.search.length >= 2) {
                this.isOpen = true;
                this.filterResults();
            }
        },
        filterResults: function() {
            this.filtered = this.languages.filter(item => item.display.toLowerCase().indexOf(this.search.toLowerCase()) !== -1);
        },
        setLanguage: function(language) {
            this.computedLanguage = language.tag;
            this.search = language.display;
            this.isOpen = false;
            this.blur();
        }
    }
};
</script>