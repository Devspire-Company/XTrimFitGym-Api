import Membership from './models/membership/membership-shema.js';
import connectDb from './connectDb.js';
const membershipPlans = [
    {
        name: 'Student',
        monthlyPrice: 500,
        description: 'Perfect for students with valid student ID',
        features: [
            'Gym access (6am-10pm)',
            'Basic equipment access',
            'Locker facilities',
            '2 group classes/month',
        ],
        status: 'Active',
        durationType: 'Monthly',
    },
    {
        name: 'PROMO Student',
        monthlyPrice: 1200,
        description: 'Special 3-month promo for students - Best value!',
        features: [
            'Gym access (6am-10pm)',
            'All equipment access',
            'Locker facilities',
            'Unlimited group classes',
            'Custom workout plans',
            'Valid for 3 months',
        ],
        status: 'Active',
        durationType: 'Quarterly',
    },
    {
        name: 'Non Student',
        monthlyPrice: 1300,
        description: '3-month membership for non-students',
        features: [
            'Gym access (6am-10pm)',
            'All equipment access',
            'Locker facilities',
            'Unlimited group classes',
            'Custom workout plans',
            'Valid for 3 months',
        ],
        status: 'Active',
        durationType: 'Quarterly',
    },
];
async function seedMemberships() {
    try {
        console.log('🔗 Connecting to database...');
        await connectDb();
        console.log('🗑️  Clearing existing membership plans...');
        await Membership.deleteMany({});
        console.log('🌱 Seeding membership plans...');
        for (const plan of membershipPlans) {
            const membership = new Membership(plan);
            await membership.save();
            console.log(`✅ Created: ${plan.name} - ₱${plan.monthlyPrice}/${plan.durationType}`);
        }
        console.log('\n✅ Membership plans seeded successfully!');
        console.log(`📊 Total plans created: ${membershipPlans.length}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding memberships:', error);
        process.exit(1);
    }
}
seedMemberships();
