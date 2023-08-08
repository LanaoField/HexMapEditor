var ActorConfig = [
    {
        Icon: './images/T_Military_1V1_01_01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V1_01_01.BP_Military_1V1_01_01_C",
        Desc: '基地',
        Name: '1v1基地Team2正'
    },
    {
        Icon: './images/T_Military_1V1_02_01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V1_02_01.BP_Military_1V1_02_01_C",
        Desc: '基地',
        Name: '1v1基地Team1正'
    },
    {
        Icon: './images/T_Military_1V2_01_01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V2_01_01.BP_Military_1V2_01_01_C",
        Desc: '基地',
        Name: '1v2基地Team1地主正'
    }, 
{
        Icon: './images/T_Military_1V2_01_02.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V2_01_02.BP_Military_1V2_01_02_C",
        Desc: '基地',
        Name: '1v2基地Team1地主斜'
    },
{
        Icon: './images/T_Military_1V2_02_01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V2_02_01.BP_Military_1V2_02_01_C",
        Desc: '基地',
        Name: '1v2基地Team2左斜'
    },
{
        Icon: './images/T_Military_1V2_02_02.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V2_02_02.BP_Military_1V2_02_02_C",
        Desc: '基地',
        Name: '1v2基地Team2右斜'
    },
{
        Icon: './images/T_Military_1V2_02_03.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V2_02_03.BP_Military_1V2_02_03_C",
        Desc: '基地',
        Name: '1v2基地Team2左正'
    },
{
        Icon: './images/T_Military_1V2_02_04.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Military/BP_Military_1V2_02_04.BP_Military_1V2_02_04_C",
        Desc: '基地',
        Name: '1v2基地Team2右正'
    },
{
        Icon: './images/T_Ore_HighEnergy.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Ore/BP_Ore_HighEnergy.BP_Ore_HighEnergy_C",
        Desc: '高级矿石',
        Name: '高级矿石'
    },
{
        Icon: './images/T_Ore_Normal.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Ore/BP_Ore_Normal.BP_Ore_Normal_C",
        Desc: '普通矿石',
        Name: '普通矿石'
    },
{
        Icon: './images/T_Rock12.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_Rock12.BP_Rock12_C",
        Desc: '石头',
        Name: '石头'
    },
{
        Icon: './images/T_TiresAndBarrels.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_TiresAndBarrels.BP_TiresAndBarrels_C",
        Desc: '障碍物',
        Name: '障碍物1'
    },
{
        Icon: './images/T_XiangZi01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_XiangZi01.BP_XiangZi01_C",
        Desc: '障碍物',
        Name: '障碍物2'
    },
{
        Icon: './images/T_Zhangai01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_Zhangai01.BP_Zhangai01_C",
        Desc: '障碍物',
        Name: '障碍物3'
    },
{
        Icon: './images/T_Zhangai02.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_Zhangai02.BP_Zhangai02_C",
        Desc: '障碍物',
        Name: '障碍物4'
    },
{
        Icon: './images/T_Zhangai03.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_Zhangai03.BP_Zhangai03_C",
        Desc: '障碍物',
        Name: '障碍物5'
    },
{
        Icon: './images/T_Land01.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Place/BP_Land01.BP_Land01_C",
        Desc: '障碍物',
        Name: '障碍物6'
    },
{
        Icon: './images/T_Population.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Population/BP_Population.BP_Population_C",
        Desc: '人口占领点',
        Name: '人口占领点'
    },
{
        Icon: './images/T_Treasure.png',
        ActorClass: "/Game/Airship/Core/Gameplay/Treasure/BP_Treasure.BP_Treasure_C",
        Desc: '资源宝箱',
        Name: '资源宝箱'
    },
]

function GetActorInfo(ActorClass) {
    for (let i = 0; i < ActorConfig.length; i++) {
        let ActorInfo = ActorConfig[i]
        if (ActorInfo.ActorClass === ActorClass) {
            return ActorInfo
        }
    }

    return null
}