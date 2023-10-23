<script setup>
import { reactive } from 'vue';
import { Dialog, DialogPanel, DialogTitle, DialogDescription, TransitionRoot, TransitionChild, } from '@headlessui/vue';

import data from '../data/PeriodicTableJSON.json';
import Element from './components/Element.vue';

const state = reactive({elements: data['elements'], dialogOpen: false, activeElement: null});

const toggleDialogOpen = () => 
{
  state.dialogOpen = !state.dialogOpen;
}

const displayElementDialog = element =>
{
  state.activeElement = element;
  //console.log(state.activeElement.symbol);
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
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-900"
              >
                {{ state.activeElement.name }} ({{ state.activeElement.symbol }})
              </DialogTitle>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Name: {{ state.activeElement.name }} <br/>
                  Atomic Mass: {{ state.activeElement.atomic_mass }} <br/>
                  Boiling Point: {{ state.activeElement.boil }} K <br/>
                  Melting Point: {{ state.activeElement.melt }} K <br/>
                  Electronegativity: {{ state.activeElement.electronegativity_pauling }} <br/>
                  Discovered By: {{ state.activeElement.discovered_by }} <br/>
                  Summary: {{ state.activeElement.summary }} <br/><br/>
                  Source: <a :href="state.activeElement.source">Wikipedia</a><br/>
                </p>
              </div>

              <div class="mt-4">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  @click="toggleDialogOpen"
                >
                  Ok
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
    <div class="h-screen w-screen">
      <div class="grid grid-cols-18 grid-rows-9">
        <Element v-for="el in state.elements" v-bind:elem="el" @click="displayElementDialog(el)"/>
      </div>
    </div>
</template>