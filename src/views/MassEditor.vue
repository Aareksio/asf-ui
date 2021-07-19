<template>
  <main class="main-container main-container--fullheight">
    <div class="container">
      <template v-if="loading || noBotsFound">
        <h3 v-if="loading" class="subtitle">
          <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
        </h3>

        <template v-if="noBotsFound">
          <h3 class="subtitle">
            {{ $t('mass-editor-no-bots') }}
          </h3>
          <div class="mass-editor__info">
            <a @click="$router.push({ name: 'bot-create' })">{{ $t('mass-editor-create-bot') }}</a>
          </div>
        </template>
      </template>

      <template v-else>
        <MassEditorSteps
          :steps="steps"
          :currentStep="status"
          :isDisabled="isStepDisabled"
          :getTitle="getDisabledTitle"
          @setStep="setStatus"
        ></MassEditorSteps>

        <MassEditorBots
          v-if="status === 'bots'"
          :bots="bots"
          :selectedBots="selectedBots"
          @toggle="toggleSelectedBots"
          @update="updateSelectedBots"
          @next="setStatus('properties')"
        ></MassEditorBots>

        <MassEditorSelect
          v-if="status === 'properties'"
          :loading="loading"
          :status="status"
          :selectedProperties="selectedProperties"
          :options="fields"
          @select="selectProperty"
          @remove="removeProperty"
          @update="updateModel"
          @next="setStatus('values')"
          @back="setStatus('bots')"
        ></MassEditorSelect>

        <MassEditorValue
          v-if="status === 'values'"
          :selectedProperties="selectedProperties"
          :categories="categories"
          :config="config"
          @next="setStatus('check')"
          @back="setStatus('properties')"
        ></MassEditorValue>

        <MassEditorCheck
          v-if="status === 'check'"
          :config="config"
          :selectedBots="selectedBots"
          :selectedProperties="selectedProperties"
          @back="setStatus('values')"
        ></MassEditorCheck>
      </template>
    </div>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import MassEditorSteps from '../components/MassEditor/Steps.vue';
  import MassEditorBots from '../components/MassEditor/Bots.vue';
  import MassEditorValue from '../components/MassEditor/Value.vue';
  import MassEditorCheck from '../components/MassEditor/Check.vue';
  import MassEditorSelect from '../components/MassEditor/Select.vue';
  import fetchConfigSchema from '../utils/fetchConfigSchema';
  import loadParameterDescriptions from '../utils/loadParameterDescriptions';
  import { botCategories } from '../utils/categories';

  export default {
    name: 'MassEditor',
    metaInfo() {
      return {
        title: this.$t('mass-editor'),
      };
    },
    components: {
      MassEditorSteps,
      MassEditorBots,
      MassEditorCheck,
      MassEditorSelect,
      MassEditorValue,
    },
    data() {
      return {
        loading: true,
        fields: [],
        model: {},
        descriptions: {},
        categories: botCategories,
        config: {},
        status: 'bots',
        selectedBots: [],
        selectedProperties: [],
        noBotsFound: false,
        steps: ['bots', 'properties', 'values', 'check'],
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
        bots: 'bots/bots',
      }),
    },
    watch: {
      async bots() {
        // I have no idea why but in the created/mounted hook,
        // 'this.bots' is sometimes empty after reload.
        const firstBot = this.bots[Object.keys(this.bots)[0]];
        if (!firstBot) {
          this.noBotsFound = true;
          this.loading = false;
        } else if (this.loading) {
          await this.loadBotConfig();
        }
      },
    },
    methods: {
      async loadBotConfig() {
        const firstBot = this.bots[Object.keys(this.bots)[0]];

        const [
          { [firstBot.name]: { BotConfig: model } },
          { body: fields },
          descriptions,
        ] = await Promise.all([
          this.$http.get(`bot/${firstBot.name}`),
          fetchConfigSchema('ArchiSteamFarm.Steam.Storage.BotConfig'),
          loadParameterDescriptions(this.version, this.$i18n.locale),
        ]);

        Object.keys(model).forEach(key => {
          if (key.startsWith('s_')) delete model[key.substr(2)];
        });

        this.model = model;

        const extendedFields = {
          SteamLogin: { placeholder: this.$t('keep-unchanged') },
          SteamPassword: { placeholder: this.$t('keep-unchanged') },
          SteamParentalCode: { placeholder: this.$t('keep-unchanged') },
        };

        this.fields = Object.keys(fields).map(key => {
          const description = (!descriptions[key])
            ? this.$t('description-not-found')
            : descriptions[key].replace(/<a href="/g, '<a target="_blank" rel="noreferrer noopener" href="');

          return { description, ...fields[key], ...(extendedFields[key] || []) };
        });

        this.noBotsFound = false;
        this.loading = false;
      },
      updateSelectedBots(bot) {
        const selectedBotNames = this.selectedBots.map(bot => bot.name);
        if (selectedBotNames.includes(bot.name)) {
          this.selectedBots = this.selectedBots.filter(selectedBot => selectedBot.name !== bot.name);
        } else {
          this.selectedBots.push(bot);
        }
      },
      selectProperty(property) {
        // initialize config property with default value
        this.config[property.param] = property.defaultValue;
      },
      removeProperty(property) {
        delete this.config[property.param];
      },
      updateModel(model) {
        this.selectedProperties = model;
      },
      setStatus(status) {
        this.status = status;
      },
      toggleSelectedBots() {
        if (this.selectedBots.length === this.bots.length) this.selectedBots = [];
        else this.selectedBots = this.bots;
      },
      isStepDisabled(step) {
        switch (step) {
          case 'properties':
            return this.selectedBots.length === 0;
          case 'values':
            return this.selectedBots.length === 0 || this.selectedProperties.length === 0;
          case 'check':
            return this.selectedBots.length === 0 || this.selectedProperties.length === 0;
          default:
            return false;
        }
      },
      getDisabledTitle(step) {
        switch (step) {
          case 'properties':
            return (this.selectedBots.length === 0) ? this.$t('mass-editor-bots-disabled') : null;
          case 'values':
          case 'check':
            if (this.selectedBots.length === 0) return this.$t('mass-editor-bots-disabled');
            return (this.selectedProperties.length === 0) ? this.$t('mass-editor-properties-disabled') : null;
          default:
            return null;
        }
      },
    },
  };
</script>

<style lang="scss">
  .mass-editor__title {
    background: var(--color-background);
    color: var(--color-text-dark);
    padding: 1em;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--color-text-dark);
  }

  .mass-editor__navigation {
    display: flex;
    padding-left: 0.7em;
    gap: 0.5em;
  }

  .mass-editor__content {
    padding: 1em;
    background: var(--color-background-modal);
    display: block;
  }

  .mass-editor__info {
    cursor: pointer;
    color: var(--color-theme);
    text-align: center;
  }
</style>
