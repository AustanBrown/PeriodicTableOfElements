<script setup>
import { reactive } from 'vue';
import { Dialog, DialogPanel, DialogTitle, DialogDescription, TransitionRoot, TransitionChild, } from '@headlessui/vue';

import data from '../data/PeriodicTableJSON.json';
import Element from './components/Element.vue';
import BohrModel from './components/BohrModel.vue';

/**
 * @typedef {Object} PeriodicElement
 * @property {string} name
 * @property {string} symbol
 * @property {number} number
 * @property {number} atomic_mass
 * @property {number|null} boil
 * @property {number|null} melt
 * @property {number|null} electronegativity_pauling
 * @property {string|null} discovered_by
 * @property {string} summary
 * @property {string} source
 * @property {string|null} bohr_model_3d
 */

const state = reactive({
  elements: data['elements'],
  dialogOpen: false,
  /** @type {PeriodicElement | null} */
  activeElement: null
});

const toggleDialogOpen = () => 
{
  state.dialogOpen = !state.dialogOpen;
}

const displayElementDialog = element =>
{
  state.activeElement = element;
  toggleDialogOpen();
}
</script>

<template>
  <TransitionRoot appear :show="state.dialogOpen" as="template">
    <Dialog as="div" @close="toggleDialogOpen" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-100 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md sm:max-w-lg md:max-w-3xl transform overflow-hidden rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all max-h-[85dvh] overflow-y-auto"
            >
              <template v-if="state.activeElement">
                <DialogTitle
                  as="h3"
                  class="text-base sm:text-lg font-medium leading-6 text-gray-900"
                >
                  {{ state.activeElement.name }} ({{ state.activeElement.symbol }})
                </DialogTitle>
                <div class="mt-2 grid gap-4 md:grid-cols-2 md:items-start">
                  <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm sm:text-base text-gray-500">
                    <dt class="font-semibold text-gray-700">Name</dt>
                    <dd>{{ state.activeElement.name }}</dd>

                    <dt class="font-semibold text-gray-700">Atomic Mass</dt>
                    <dd>{{ state.activeElement.atomic_mass ?? '—' }}</dd>

                    <dt class="font-semibold text-gray-700">Boiling Point (K)</dt>
                    <dd>{{ state.activeElement.boil ?? '—' }}</dd>

                    <dt class="font-semibold text-gray-700">Melting Point (K)</dt>
                    <dd>{{ state.activeElement.melt ?? '—' }}</dd>

                    <dt class="font-semibold text-gray-700">Electronegativity</dt>
                    <dd>{{ state.activeElement.electronegativity_pauling ?? '—' }}</dd>

                    <dt class="font-semibold text-gray-700">Discovered By</dt>
                    <dd>{{ state.activeElement.discovered_by ?? '—' }}</dd>

                    <dt class="font-semibold text-gray-700 self-start">Summary</dt>
                    <dd>{{ state.activeElement.summary ?? '—' }}</dd>

                    <dt class="font-semibold text-gray-700 self-start">Source</dt>
                    <dd>
                      <a
                        v-if="state.activeElement.source"
                        :href="state.activeElement.source"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 underline hover:text-blue-800"
                      >Wikipedia</a>
                      <span v-else>—</span>
                    </dd>
                  </dl>

                  <BohrModel
                    :key="state.activeElement.number"
                    :model-url="state.activeElement.bohr_model_3d"
                    :label="state.activeElement.name"
                  />
                </div>

                <div class="mt-4">
                  <button
                    type="button"
                    class="inline-flex w-full sm:w-auto justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    @click="toggleDialogOpen"
                  >
                    Ok
                  </button>
                </div>
              </template>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
    <div class="w-full min-h-screen flex flex-col items-center justify-center p-2 sm:p-4">
      <div class="pt-scope">
        <div class="pt-grid">
          <Element v-for="el in state.elements" :key="el.number" :elem="el" @click="displayElementDialog(el)"/>
        </div>
      </div>
    </div>
</template>
