import { EquipmentBrowse } from '@/components/EquipmentBrowse';
import FixedView from '@/components/FixedView';
import React from 'react';

const CoachEquipment = () => (
	<FixedView className="flex-1 bg-[#0D0D0D]">
		<EquipmentBrowse showTabHeader={false} />
	</FixedView>
);

export default CoachEquipment;
