<template>
    <div :class="[ showLanguage ? 'field has-addons' : !showLanguage, 'control']">
        <!-- language modifier -->
        <div
            v-if="showLanguage"
            class="control auto-complete__control">
            <input
                v-if="showLanguage"
                ref="language"
                class="input is-small"
                v-model="search"
                @input="onSearchChange"
                @blur="blur">
            <span class="auto-complete">
                <ul v-show="isOpen">
                    <li
                        v-for="(result, i) in filtered"
                        :key="i"
                        @mousedown="setLanguage(result)">
                        {{ result.display }}
                    </li>
                </ul>
            </span>
        </div>
        <p
            v-if="showLanguage"
            class="control is-expanded">
            <textarea
                ref="textarea"
                class="textarea is-expanded "
                rows="1"
                v-model="computedText"
                @blur="blur" />
        </p>
        <!-- timestamp -->
        <input
            v-if="range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime'"
            class="input is-small is-fullwidth date-time"
            v-model="computedText"
            type="datetime-local"
            @blur="blur">
        <span
            class="select is-small"
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
            class="textarea is-expanded "
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
        options: null,
        newProperty: Boolean
    },
    created: function() {
    },
    data: function() {
        var property = this.expandedThing[this.expandedProperty];
        if (this.newProperty === true) {
            property = "";
        }
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
                text: property,
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
            if (this.newProperty === true) {
                this.text = {};
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
                    this.text["@value"] = value;
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
                    this.text["@language"] = value;
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
            this.$parent.updatePropertyString(this.text, this.indexInternal);
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