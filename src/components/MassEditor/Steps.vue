<template>
  <ul class="wizard">
    <li v-for="step in steps" :key="step" :class="{ active: currentStep === step }" class="wizard__step">
      <span class="wizard__step-name" :class="{ disabled: isStepDisabled(step) }" :title="getDisabledTitle(step)" @click="setStep(step)">{{ step }}</span>
    </li>
  </ul>
</template>

<script>
  export default {
    name: 'MassEditorSteps',
    props: {
      steps: { type: Array, required: true },
      currentStep: { type: String, required: true },
      isDisabled: { type: Function, required: true },
      getTitle: { type: Function, required: true },
    },
    methods: {
      setStep(step) {
        if (!this.isStepDisabled(step)) this.$emit('setStep', step);
      },
      isStepDisabled(step) {
        return this.isDisabled(step);
      },
      getDisabledTitle(step) {
        return this.getTitle(step);
      },
    },
  };
</script>

<style lang="scss">
  .wizard {
    counter-reset: stepNo;
    display: flex;
    padding: 0;
    margin: 1em;
    margin-top: 0.5em;

    @media screen and (max-width: 460px) {
      margin: 0.5em 0 1em 0;
    }
  }

  .wizard__step {
    flex: 1;
    list-style: none;
    position: relative;
    text-align: center;
    z-index: 10;

    &:first-child {
      &:after {
        display: none;
      }
    }

    &:hover,
    &.active {
      color: var(--color-theme);
    }

    &:before {
      background: var(--color-background-modal);
      border-radius: 50%;
      counter-increment: stepNo;
      content: counter(stepNo);
      width: 32px;
      height: 32px;
      line-height: 32px;
      border: 2px solid var(--color-background-modal);
      display: block;
      text-align: center;
      margin: 0 auto 10px auto;
      font-size: 18px;

      @media screen and (max-width: 460px) {
        width: 24px;
        height: 24px;
        line-height: 24px;
        font-size: 16px;
      }
    }

    &:after {
      width: 100%;
      height: 2px;
      content: "";
      position: absolute;
      background-color: var(--color-background-modal);
      top: 18px;
      left: -45%;
      z-index: -1;

      @media screen and (max-width: 460px) {
        top: 14px;
      }
    }
  }

  .wizard__step-name {
    text-transform: uppercase;
    cursor: pointer;
    padding: 1em;

    &.disabled {
      cursor: not-allowed;
    }
  }
</style>
