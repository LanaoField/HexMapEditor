var ActorConfig = [
    {
        Icon: './images/T_Card_Artillery.png',
        Class: '/Game/Airship/Core/Gameplay/Military/BP_Military_1V1_01_01.BP_Military_1V1_01_01_C',
        Desc: '基地',
        Name: 'BP_Military_1V1_01_01'
    },
    {
        Icon: './images/T_Card_Avatar.png',
        Class: '/Game/Airship/Core/Gameplay/Military/BP_Military_1V1_02_01.BP_Military_1V1_02_01_C',
        Desc: '基地',
        Name: 'BP_Military_1V1_02_01'
    }
]

function GetActorInfo(Class) {
    for (let i = 0; i < ActorConfig.length; i++) {
        let ActorInfo = ActorConfig[i]
        if (ActorInfo.Class === Class) {
            return ActorInfo
        }
    }

    return null
}