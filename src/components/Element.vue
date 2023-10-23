<script setup>
import { computed, reactive } from 'vue';
const gridData = reactive({
    rows: {
        1: 'row-start-1 row-end-1',
        2: 'row-start-2 row-end-2',
        3: 'row-start-3 row-end-3',
        4: 'row-start-4 row-end-4',
        5: 'row-start-5 row-end-5',
        6: 'row-start-6 row-end-6',
        7: 'row-start-7 row-end-7',
        8: 'row-start-8 row-end-8',
        9: 'row-start-9 row-end-9',
        10: 'row-start-10 row-end-10',
        11: 'row-start-11 row-end-11',
        12: 'row-start-12 row-end-12',
        13: 'row-start-13 row-end-13',
        14: 'row-start-14 row-end-14',
        15: 'row-start-15 row-end-15',
        16: 'row-start-16 row-end-16',
        17: 'row-start-17 row-end-17',
        18: 'row-start-18 row-end-18',
    },
    cols: {
        1: 'col-start-1 col-end-1',
        2: 'col-start-2 col-end-2',
        3: 'col-start-3 col-end-3',
        4: 'col-start-4 col-end-4',
        5: 'col-start-5 col-end-5',
        6: 'col-start-6 col-end-6',
        7: 'col-start-7 col-end-7',
        8: 'col-start-8 col-end-8',
        9: 'col-start-9 col-end-9',
        10: 'col-start-10 col-end-10',
        11: 'col-start-11 col-end-11',
        12: 'col-start-12 col-end-12',
        13: 'col-start-13 col-end-13',
        14: 'col-start-14 col-end-14',
        15: 'col-start-15 col-end-15',
        16: 'col-start-16 col-end-16',
        17: 'col-start-17 col-end-17',
        18: 'col-start-18 col-end-18',
    }
});
const props = defineProps({
    elem: Object,
});

const gridClasses = computed(() =>
{
    if(props.elem.number > 57 && props.elem.number <= 71)
    {
        return gridData.rows[9] + ' ' + gridData.cols[(props.elem.number - 54) - 1];
    }
    else if(props.elem.number > 89 && props.elem.number <= 103)
    {
        return gridData.rows[10] + ' ' + gridData.cols[(props.elem.number - 88) + 1];
    }
    return gridData.rows[props.elem.period] + ' ' + gridData.cols[props.elem.group];
}); 
</script>

<template>
    <div class="p-1 m-0.5 border-2 row-span-1 col-span-1 text-center hover:opacity-75 cursor-pointer" :title="elem.name" :class="[gridClasses, {'bg-purple-400 border-purple-700 text-white': props.elem.category.includes('noble gas'), 'bg-yellow-400 border-yellow-700 text-black': props.elem.category.includes('nonmetal'), 'bg-blue-400 border-blue-700 text-black': props.elem.category.includes('transition metal'), 'bg-violet-400 border-violet-700 text-white': props.elem.category.includes('alkaline'), 'bg-indigo-400 border-indigo-700 text-white': props.elem.category.includes('alkali '), 'bg-red-400 border-red-700 text-white': props.elem.category.includes('metalloid'), 'bg-gray-400 border-gray-700 text-black': props.elem.category.includes('lanthanide'), 'bg-brown-400 border-brown-700 text-black': props.elem.category.includes('actinide')}]">
        <div class="flex flex-col">
            <small class="text-xs self-start font-black">{{ elem.number }}</small>
            <div class="flex flex-row justify-between">
                <small class="-rotate-90 text-xs text-center">{{ elem.electronegativity_pauling }}</small>
                <h1 class="text-base p-0 m-0">{{ elem.symbol }}</h1>
                <small class="rotate-90 text-xs mr-0.5">Td</small>
            </div>
            <small class="text-xs">{{ parseFloat(elem.atomic_mass).toFixed(2) }}</small>
        </div>
    </div>
</template>