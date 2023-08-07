var Canvas = null
var CTX = null
var HexGenerator = null
var bInitialize = false
var MapData = []
var CurrentLayerIndex = -1
var CurrentAttributeSetIndex = -1
var CurrentModifiesIndex = -1
var CurrentModifiesFlagsIndex = -1
var CurrentModifiesActorsIndex = -1
var ConfigFilename = 'undefined.json'
var ClassContent = ''
var Images = new Map()

// 六边形格子Flags
const EHexFlag = {
    NoCreated: 1 << 1,
    NoMoved: 1 << 2,
    NoInfantry: 1 << 3,
    NoVehicle: 1 << 4,
    NoAircraft: 1 << 5
}

// 位置
class FPosition {
    constructor(X, Y) {
        this.X = X
        this.Y = Y
    }
}

// 坐标
class FCoordinate {
    constructor(X, Y, Z) {
        this.X = X
        this.Y = Y
        this.Z = Z
    }
}

// 六边形格子对象
class FHex {
    constructor(OR, IR, Position, Coordinate) {
        this.Coordinate = Coordinate
        this.Position = Position
        this.OR = OR
        this.IR = IR
        this.bSelected = false
        this.bNoCreated = false
        this.bNoMoved = false
        this.Flags = new Map()
        this.Actors = new Map()
    }
}

// 格子生成器
class AHexGenerator {
    constructor(OR, Width, Height) {
        this.OR = OR
        this.IR = this.OR * Math.cos(30 * (Math.PI / 180))
        this.Width = Width
        this.Height = Height
        this.Hexes = null
    }

    SetOR(OR) {
        this.OR = OR
        this.IR = this.OR * Math.cos(30 * (Math.PI / 180))
    }

    SetWidth(Width) {
        this.Width = Width
    }

    SetHeight(Height) {
        this.Height = Height
    }

    CreateHexes() {
        this.Hexes = new Map()

        for (let i = 0; i < this.Height; i++) {
            for (let j = 0; j < this.Width; j++) {
                let Position = new FPosition(this.IR * 2.0 * j + ((i % 2) == 1 ? this.IR : 0) + this.IR, this.OR * 1.5 * i + this.OR)
                let Coordinate = new FCoordinate(j - Math.floor(i / 2), i, (j - Math.floor(i / 2) + i) * -1)
                let NewHex = new FHex(this.OR, this.IR, Position, Coordinate)

                this.Hexes.set(MakeCoordinateKey(Coordinate), NewHex)
            }
        }
    }
};

// 创建一个坐标Key
function MakeCoordinateKey(Coordinate) {
    let Key = ''
    Key += Coordinate.X
    Key += '|'
    Key += Coordinate.Y
    Key += '|'
    Key += Coordinate.Z
    return Key
}

// 保存地图数据
function SaveMapData() {
    localStorage.setItem("MapData", JSON.stringify(MapData))
}

// 保存编辑状态
function SaveEditState() {
    localStorage.setItem("CurrentLayerIndex", CurrentLayerIndex)
    localStorage.setItem("CurrentAttributeSetIndex", CurrentAttributeSetIndex)
    localStorage.setItem("CurrentModifiesIndex", CurrentModifiesIndex)
    localStorage.setItem("CurrentModifiesFlagsIndex", CurrentModifiesFlagsIndex)
    localStorage.setItem("CurrentModifiesActorsIndex", CurrentModifiesActorsIndex)
    localStorage.setItem("HexGenerator.OR", HexGenerator.OR)
    localStorage.setItem("HexGenerator.Width", HexGenerator.Width)
    localStorage.setItem("HexGenerator.Height", HexGenerator.Height)
}

// 获取当前图层
function GetCurrentLayer() {
    if (!MapData) {
        return null
    }

    return MapData[CurrentLayerIndex]
}

// 获取当前AttributeSet
function GetCurrentAttributeSet() {
    let CurrentLayer = GetCurrentLayer()
    if (!CurrentLayer) {
        return null
    }

    return CurrentLayer.AttributeSet
}

// 获取当前Attribute
function GetCurrentAttribute() {
    let AttributeSet = GetCurrentAttributeSet()
    if (!AttributeSet) {
        return null
    }

    return AttributeSet[CurrentAttributeSetIndex]
}

// 获取当前Coordinates
function GetCurrentCoordinates() {
    let Attribute = GetCurrentAttribute()
    if (!Attribute) {
        return null
    }

    return Attribute.Coordinates
}

// 获取当前Modifies
function GetCurrentModifies() {
    let Attribute = GetCurrentAttribute()
    if (!Attribute) {
        return null
    }

    return Attribute.Modifies
}

// 获取当前Modify
function GetCurrentModify() {
    let Modifies = GetCurrentModifies()
    if (!Modifies) {
        return null
    }

    return Modifies[CurrentModifiesIndex]
}

// 获取当前Flags
function GetCurrentFlags() {
    let Motify = GetCurrentModify()
    if (!Motify) {
        return null
    }

    return Motify.Flags
}

// 获取当前Flag
function GetCurrentFlag() {
    let Flags = GetCurrentFlags()
    if (!Flags) {
        return null
    }

    return Flags[CurrentModifiesFlagsIndex]
}

// 获取当前Actors
function GetCurrentActors() {
    let Motify = GetCurrentModify()
    if (!Motify) {
        return null
    }

    return Motify.Actors
}

// 获取当前Actor
function GetCurrentActor() {
    let Actors = GetCurrentActors()
    if (!Actors) {
        return null
    }

    return Actors[CurrentModifiesActorsIndex]
}

// 绘制单个六边形
function DrawHex(X, Y, OR) {
    CTX.beginPath()
    for (let i = 1; i <= 6; i++) {
        CTX.lineTo(X + OR * Math.sin(2 * Math.PI * i / 6), Y + OR * Math.cos(2 * Math.PI * i / 6));
    }
    CTX.closePath()
    CTX.lineWidth = 1
    CTX.lineJoin = 'round'
    CTX.stroke()
    CTX.fill()
}

// 绘制六边形
function DrawHexes() {
    if (!bInitialize) {
        return
    }

    if (!HexGenerator) {
        return
    }

    CTX.clearRect(0, 0, Canvas.width, Canvas.height)

    // 重新计算canvas宽高
    Canvas.width = HexGenerator.IR * HexGenerator.Width * 2 + HexGenerator.IR + 10
    Canvas.height = HexGenerator.OR * 2 * (Math.floor(HexGenerator.Height / 2) + 1) + HexGenerator.IR * (Math.floor(HexGenerator.Height / 2) + 1) + 10

    let AttributeSet = GetCurrentAttributeSet()
    if (AttributeSet) {
        // 清除数据
        for (let [key, value] of HexGenerator.Hexes) {
            let Hex = value
            Hex.bSelected = false
            Hex.bNoCreated = false
            Hex.bNoMoved = false
            Hex.Flags.clear()
            Hex.Actors.clear()
        }

        // 填充数据
        for (let i = 0; i < AttributeSet.length; i++) {
            let Attribute = AttributeSet[i]

            let Flags = new Map()
            let Actors = new Map()
            let bSelected = (i == CurrentAttributeSetIndex)
            for (let j = 0; j < Attribute.Modifies.length; j++) {
                let Modify = Attribute.Modifies[j]
                for (let k = 0; k < Modify.Flags.length; k++) {
                    Flags.set(i + ' | ' + j + ' | ' + k, Modify.Flags[k])
                }
                for (let k = 0; k < Modify.Actors.length; k++) {
                    Actors.set(i + ' | ' + j + ' | ' + k, Modify.Actors[k])
                }
            }

            for (let j = 0; j < Attribute.Coordinates.length; j++) {
                let Key = MakeCoordinateKey(Attribute.Coordinates[j])
                let Hex = HexGenerator.Hexes.get(Key)
                if (!Hex) {
                    continue
                }

                Hex.bSelected = bSelected

                for (let [key, value] of Flags) {
                    Hex.Flags.set(key, value)

                    if ((value.Flags & EHexFlag.NoCreated) != 0) {
                        Hex.bNoCreated = true
                    }

                    if ((value.Flags & EHexFlag.NoMoved) != 0) {
                        Hex.bNoMoved = true
                    }
                }

                for (let [key, value] of Actors) {
                    Hex.Actors.set(key, value)
                }
            }
        }

        // 绘制基础六边形
        let OR = HexGenerator.OR
        let IR = HexGenerator.IR
        let Scale = Math.max(0.2, OR / 50)
        CTX.strokeStyle = '#000000'
        for (let [key, value] of HexGenerator.Hexes) {
            let Hex = value

            let Position = Hex.Position
            let Coordinate = Hex.Coordinate

            if (Hex.bNoCreated) {
                CTX.fillStyle = '#ffffff'
                DrawHex(Position.X, Position.Y, OR)
            }
            else if (Hex.bNoMoved) {
                CTX.fillStyle = '#eeeeee'
                DrawHex(Position.X, Position.Y, OR)
            }
            else {
                CTX.fillStyle = '#00ffff'
                DrawHex(Position.X, Position.Y, OR)

                // 绘制坐标
                CTX.fillStyle = '#000000'
                CTX.font = Math.ceil(10 * Scale) + 'px Yahei'
                CTX.fillText('(' + Coordinate.X + ',' + Coordinate.Y + ',' + Coordinate.Z + ')', Position.X - Scale * 20, Position.Y + Math.ceil(5 * Scale))
            }

            // if (Hex.Flags.size > 0 || Hex.Actors.size > 0) {
            //     CTX.fillStyle = 'rgba(0, 0, 0, 0.5)'
            //     DrawHex(Position.X, Position.Y, OR)
            // }

            // 绘制Actors
            let ActorX = Position.X - Hex.IR
            let ActorY = Position.Y - Hex.IR
            for (let [key, value] of Hex.Actors) {
                let Actor = value
                let ActorInfo = GetActorInfo(Actor.Class)
                if (ActorInfo) {
                    CTX.drawImage(Images.get(ActorInfo.Name), ActorX, ActorY, Hex.IR * 2, Hex.IR * 2)
                }
            }

            // 绘制Flags
            const Size = 20 * Scale

            let FlagX = Position.X - Hex.IR
            let FlagY = Position.Y - (Hex.IR + Size) * 0.5

            let FlagsNum = 0
            for (let [key, value] of Hex.Flags) {
                let Flag = value
                let Num = 0

                if ((Flag.Flags & (EHexFlag.NoInfantry | EHexFlag.NoVehicle | EHexFlag.NoAircraft)) != 0) {
                    CTX.fillStyle = 'rgba(0, 0, 0, 0.75)'
                    CTX.fillRect(FlagX + 2, FlagY + FlagsNum * Size, Hex.IR * 2 - 4, Size)
                }

                if ((Flag.Flags & EHexFlag.NoInfantry) != 0) {
                    CTX.drawImage(Images.get('NoInfantry'), FlagX + Num * Size, FlagY + FlagsNum * Size, Size, Size)
                    ++Num
                }
                if ((Flag.Flags & EHexFlag.NoVehicle) != 0) {
                    CTX.drawImage(Images.get('NoVehicle'), FlagX + Num * Size, FlagY + FlagsNum * Size, Size, Size)
                    ++Num
                }
                if ((Flag.Flags & EHexFlag.NoAircraft) != 0) {
                    CTX.drawImage(Images.get('NoAircraft'), FlagX + Num * Size, FlagY + FlagsNum * Size, Size, Size)
                    ++Num
                }

                if (Num > 0) {
                    CTX.fillStyle = '#ffffff'
                    CTX.font = Math.ceil(10 * Scale) + 'px Yahei'
                    CTX.fillText(key + '-' + Flag.Weight, FlagX + Num * Size, FlagY + 12 * Scale + FlagsNum * Size)

                    FlagsNum++
                }
            }
        }

        // 绘制选择框
        let Coordinates = GetCurrentCoordinates()
        for (let i = 0; i < Coordinates.length; i++) {
            let Key = MakeCoordinateKey(Coordinates[i])
            let Hex = HexGenerator.Hexes.get(Key)
            let Position = Hex.Position
            let X = Position.X
            let Y = Position.Y
            let OR = Hex.OR
            CTX.strokeStyle = 'rgba(255, 0, 0, 1)'
            CTX.beginPath()
            for (let i = 1; i <= 6; i++) {
                CTX.lineTo(X + OR * Math.sin(2 * Math.PI * i / 6), Y + OR * Math.cos(2 * Math.PI * i / 6));
            }
            CTX.closePath()
            CTX.lineWidth = 2
            CTX.lineJoin = 'round'
            CTX.stroke()
        }
    }
}

// 碰撞检测
function IsCollision(X, Y, HX, HY, OR, IR) {
    let AbsX = Math.abs(X - HX)
    let AbsY = Math.abs(Y - HY)
    let Edge = Math.sqrt(AbsX * AbsX + AbsY * AbsY)
    return Edge <= IR
}

// 图片加载
async function ImageLoader(Key, Src) {
    return new Promise((resolve, reject) => {
        let NewImage = new Image()
        NewImage.src = Src
        NewImage.onload = function () {
            Images.set(Key, this)
            resolve()
        }
    })
}

/**
 * Html 事件
 */
window.onload = async function () {
    Canvas = document.getElementById('canvas')
    Canvas.addEventListener('click', CanvasClick)

    CTX = Canvas.getContext('2d');

    let MapDataItem = localStorage.getItem("MapData")
    let Data = JSON.parse(MapDataItem)
    if (Data) {
        MapData = Data
    }

    let LayerIndex = localStorage.getItem("CurrentLayerIndex")
    if (LayerIndex) {
        CurrentLayerIndex = parseInt(LayerIndex)
    }
    let AttributeSetIndex = localStorage.getItem("CurrentAttributeSetIndex")
    if (AttributeSetIndex) {
        CurrentAttributeSetIndex = parseInt(AttributeSetIndex)
    }
    let ModifiesIndex = localStorage.getItem("CurrentModifiesIndex")
    if (ModifiesIndex) {
        CurrentModifiesIndex = parseInt(ModifiesIndex)
    }
    let ModifiesFlagsIndex = localStorage.getItem("CurrentModifiesFlagsIndex")
    if (ModifiesFlagsIndex) {
        CurrentModifiesFlagsIndex = parseInt(ModifiesFlagsIndex)
    }
    let ModifiesActorsIndex = localStorage.getItem("CurrentModifiesActorsIndex")
    if (ModifiesActorsIndex) {
        CurrentModifiesActorsIndex = parseInt(ModifiesActorsIndex)
    }

    let OR = localStorage.getItem("HexGenerator.OR")
    if (OR) {
        OR = parseInt(OR)

        let HexSize = document.getElementById('HexSize')
        HexSize.value = OR
    }
    else {
        OR = 50
    }

    let Width = localStorage.getItem("HexGenerator.Width")
    if (Width) {
        Width = parseInt(Width)

        let HexWidth = document.getElementById('HexWidth')
        HexWidth.value = Width
    }
    else {
        Width = 15
    }

    let Height = localStorage.getItem("HexGenerator.Height")
    if (Height) {
        Height = parseInt(Height)

        let HexHeight = document.getElementById('HexHeight')
        HexHeight.value = Height
    }
    else {
        Height = 15
    }

    // 构建生成器
    HexGenerator = new AHexGenerator(OR, Width, Height)
    HexGenerator.CreateHexes()

    if (Canvas && CTX && HexGenerator) {
        bInitialize = true
    }
    else {
        bInitialize = false
    }

    // 加载资源
    await ImageLoader('NoAircraft', './images/NoAircraft.png')
    await ImageLoader('NoInfantry', './images/NoInfantry.png')
    await ImageLoader('NoVehicle', './images/NoVehicle.png')

    ClassContent += '<select onchange=\'OnClassSelect(this)\'>'
    ClassContent += '<option value=\'\'>无</option>'
    for (let i = 0; i < ActorConfig.length; i++) {
        let ActorInfo = ActorConfig[i]
        await ImageLoader(ActorInfo.Name, ActorInfo.Icon)

        ClassContent += '<option value=\'' + ActorInfo.Class + '\'>' + ActorInfo.Name + '</option>'
    }
    ClassContent += '/<select>'

    // 重绘绘制六边形
    DrawHexes()

    UpdateLayersList()
}

// 六边形（宽）改变事件
function OnHexWidthChange(e) {
    let value = parseInt(e.value)
    if (value > 0 && value <= 100) {
        HexGenerator.SetWidth(value)
        HexGenerator.CreateHexes()

        SaveEditState()

        DrawHexes()
    }
}

// 六边形（高）改变事件
function OnHexHeightChange(e) {
    let value = parseInt(e.value)
    if (value > 0 && value <= 100) {
        HexGenerator.SetHeight(value)
        HexGenerator.CreateHexes()

        SaveEditState()

        DrawHexes()
    }
}

// 六边形（OR）改变事件
function OnHexSizeChange(e) {
    let value = parseInt(e.value)
    if (value >= 10 && value <= 100) {
        HexGenerator.SetOR(value)
        HexGenerator.CreateHexes()

        SaveEditState()

        DrawHexes()
    }
}

// 更新图层列表HTML
function UpdateLayersList() {
    let LayersListElement = document.getElementById('Layers-List')
    let Content = ""
    for (let i = 0; i < MapData.length; i++) {
        let LayerData = MapData[i]
        if (i === CurrentLayerIndex) {
            Content += '<li class=\'Selected\' onclick=\'OnLayersClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteLayerClick(this)\' />\
                <input type=\'text\' class=\'LayerName\' value=\'' + LayerData.Name + '\' onblur=\'OnLayerBlur(this)\' />\
            </li>'
        }
        else {
            Content += '<li onclick=\'OnLayersClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteLayerClick(this)\' />\
                <input type=\'text\' class=\'LayerName\' value=\'' + LayerData.Name + '\' onblur=\'OnLayerBlur(this)\' />\
            </li>'
        }
    }
    LayersListElement.innerHTML = Content

    UpdateAttributeSetList()
}

// 更新属性列表HTML
function UpdateAttributeSetList() {
    let Content = ""

    let AttributeSetListElement = document.getElementById('AttributeSet-List')

    let AttributeSet = GetCurrentAttributeSet()
    if (AttributeSet) {
        for (let i = 0; AttributeSet && i < AttributeSet.length; i++) {
            if (i === CurrentAttributeSetIndex) {
                Content += '<li class=\'Selected\' onclick=\'OnAttributeSetClick(this)\'>\
                    <input type=\'button\' value=\'X\' onclick=\'DeleteAttributeSetClick(this)\' />[' + i + ']\
                </li>'
            }
            else {
                Content += '<li onclick=\'OnAttributeSetClick(this)\'>\
                    <input type=\'button\' value=\'X\' onclick=\'DeleteAttributeSetClick(this)\' />[' + i + ']\
                </li>'
            }
        }

        if (!AttributeSet || AttributeSet.length <= 0) {
            Content += '<li>无</li>\r\n'
        }
    }
    AttributeSetListElement.innerHTML = Content

    UpdateCoordinatesList()
    UpdateModifiesList()
}

// 更新坐标列表HTML
function UpdateCoordinatesList() {
    let Content = ""

    let CoordinatesListElement = document.getElementById('Coordinates-List')
    let Coordinates = GetCurrentCoordinates()
    for (let j = 0; Coordinates && j < Coordinates.length; j++) {
        let Coordinate = Coordinates[j]
        Content += '<li>\
            <input type=\'button\' value=\'X\' onclick=\'DeleteCoordinatesClick(this)\' />\
            <input value=\'[' + Coordinate.X + ', ' + Coordinate.Y + ', ' + Coordinate.Z + ']\' type=\'text\' onchange=\'OnCoordinatesChange(this)\' />\
        </li>'
    }

    if (!Coordinates || Coordinates.length <= 0) {
        Content += '<li>无</li>\r\n'
    }
    CoordinatesListElement.innerHTML = Content

    DrawHexes()
}

// 更新属性修改列表HTML
function UpdateModifiesList() {
    let Content = ""

    let ModifiesListElement = document.getElementById('Modifies-List')
    let Modifies = GetCurrentModifies()
    for (let i = 0; Modifies && i < Modifies.length; i++) {
        let Modify = Modifies[i]
        if (i == CurrentModifiesIndex) {
            Content += '<li class=\'Selected\' onclick=\'OnModifiesListClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteModifiesClick(this)\' />[' + i + ']\
                <ul>\
                    <li>随机集合<input type=\'checkbox\' name=\'bRandomSet\' '+ (Modify.bRandomSet ? 'checked=\'true\'' : '') + ' onclick=\'OnRandomSetClick(this)\' /></li>\
                    <li>随机数量<input type=\'number\' name=\'RandomNumber\' value=\'' + Modify.RandomNumber + '\' onblur=\'OnRandomNumberBlur(this)\' /></li>\
                    <li>随机区间<input type=\'number\' name=\'RandomDeviation\' value=\'' + Modify.RandomDeviation + '\' onblur=\'OnRandomDeviationBlur(this)\' /></li>\
                </ul >\
            </li>'
        }
        else {
            Content += '<li onclick=\'OnModifiesListClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteModifiesClick(this)\' />[' + i + ']\
                <ul>\
                    <li>随机集合<input type=\'checkbox\' name=\'bRandomSet\' '+ (Modify.bRandomSet ? 'checked=\'true\'' : '') + ' onclick=\'OnRandomSetClick(this)\' /></li>\
                    <li>随机数量<input type=\'number\' name=\'RandomNumber\' value=\'' + Modify.RandomNumber + '\' onblur=\'OnRandomNumberBlur(this)\' /></li>\
                    <li>随机区间<input type=\'number\' name=\'RandomDeviation\' value=\'' + Modify.RandomDeviation + '\' onblur=\'OnRandomDeviationBlur(this)\' /></li>\
                </ul >\
            </li > '
        }
    }

    if (!Modifies || Modifies.length <= 0) {
        Content += '<li>无</li>\r\n'
    }
    ModifiesListElement.innerHTML = Content

    UpdateModifiesFlagsList()
    UpdateModifiesActorsList()
}

// 更新属性修改Flags列表HTML
function UpdateModifiesFlagsList() {
    let Content = ""

    let ModifiesFlagsListElement = document.getElementById('Modifies-Flags-List')
    let Flags = GetCurrentFlags()
    for (let i = 0; Flags && i < Flags.length; i++) {
        let Flag = Flags[i]
        if (i == CurrentModifiesFlagsIndex) {
            Content += '<li class=\'Selected\' onclick=\'OnModifiesFlagsListClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteModifiesFlagsClick(this)\' />[' + i + ']\
                <ul>\
                    <li>权重：<input type=\'number\' name=\'FlagsWeight\' onchange=\'OnFlagWeightChange(this)\' value=\'' + Flag.Weight + '\'></li>\
                    <li class=\'line-through\'>\
                        <input type=\'checkbox\' name=\'NoCreated\' ' + ((Flag.Flags & EHexFlag.NoCreated) != 0 ? 'checked=\'true\'' : '') + ' onclick =\'OnFlagFlagsClick(this)\' />创建\
                        <input type=\'checkbox\' name=\'NoMoved\' ' + ((Flag.Flags & EHexFlag.NoMoved) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />移动\
                        <input type=\'checkbox\' name=\'NoInfantry\' ' + ((Flag.Flags & EHexFlag.NoInfantry) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />步兵\
                        <input type=\'checkbox\' name=\'NoVehicle\' ' + ((Flag.Flags & EHexFlag.NoVehicle) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />载具\
                        <input type=\'checkbox\' name=\'NoAircraft\' ' + ((Flag.Flags & EHexFlag.NoAircraft) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />空军\
                    </li>\
                </ul>\
            </li>'
        }
        else {
            Content += '<li onclick=\'OnModifiesFlagsListClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteModifiesFlagsClick(this)\' />[' + i + ']\
                <ul>\
                    <li>权重：<input type=\'number\' name=\'FlagsWeight\' onchange=\'OnFlagWeightChange(this)\' value=\'' + Flag.Weight + '\'></li>\
                    <li class=\'line-through\'>\
                        <input type=\'checkbox\' name=\'NoCreated\' ' + ((Flag.Flags & EHexFlag.NoCreated) != 0 ? 'checked=\'true\'' : '') + ' onclick =\'OnFlagFlagsClick(this)\' />创建\
                        <input type=\'checkbox\' name=\'NoMoved\' ' + ((Flag.Flags & EHexFlag.NoMoved) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />移动\
                        <input type=\'checkbox\' name=\'NoInfantry\' ' + ((Flag.Flags & EHexFlag.NoInfantry) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />步兵\
                        <input type=\'checkbox\' name=\'NoVehicle\' ' + ((Flag.Flags & EHexFlag.NoVehicle) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />载具\
                        <input type=\'checkbox\' name=\'NoAircraft\' ' + ((Flag.Flags & EHexFlag.NoAircraft) != 0 ? 'checked=\'true\'' : '') + ' onclick=\'OnFlagFlagsClick(this)\' />空军\
                    </li>\
                </ul>\
            </li>'
        }
    }

    if (!Flags || Flags.length <= 0) {
        Content += '<li>无</li>\r\n'
    }
    ModifiesFlagsListElement.innerHTML = Content
}

// 更新属性修改Actors列表HTML
function UpdateModifiesActorsList() {
    let Content = ''

    let ModifiesActorsListElement = document.getElementById('Modifies-Actors-List')
    let Actors = GetCurrentActors()
    for (let i = 0; Actors && i < Actors.length; i++) {
        let Actor = Actors[i]
        let SpawnTransform = Actor.SpawnTransform
        let Translation = SpawnTransform.Translation
        let Rotation = SpawnTransform.Rotation
        let Scale3D = SpawnTransform.Scale3D

        let NewClassContent = ClassContent.replace('value=\'' + Actor.Class + '\'', 'value=\'' + Actor.Class + '\' selected=\'selected\'')
        if (i == CurrentModifiesActorsIndex) {
            Content += '<li class=\'Selected\' onclick=\'OnModifiesActorsListClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteModifiesActorsClick(this)\' />[' + i + ']\
                <ul>\
                    <li>权重：<input type=\'number\' onchange=\'OnActorWeightChange(this)\' value=\'' + Actor.Weight + '\'></li>\
                    <li>Class:' + NewClassContent + '</li>\
                    <li>Transform:\
                        <ul>\
                            <li>位置：<input type=\'text\' value=\'[' + Translation.X + ',' + Translation.Y + ',' + Translation.Z + ']\' onchange=\'OnActorTranslationChange(this)\' /></li>\
                            <li>旋转：<input type=\'text\' value=\'[' + Rotation.X + ',' + Rotation.Y + ',' + Rotation.Z + ',' + Rotation.W + ']\' onchange=\'OnActorRotationChange(this)\' /></li>\
                            <li>缩放：<input type=\'text\' value=\'[' + Scale3D.X + ',' + Scale3D.Y + ',' + Scale3D.Z + ']\' onchange=\'OnActorScale3DChange(this)\' /></li>\
                        </ul>\
                    <li>\
                </ul>\
            </li>\r\n'
        }
        else {
            Content += '<li onclick=\'OnModifiesActorsListClick(this)\'>\
                <input type=\'button\' value=\'X\' onclick=\'DeleteModifiesActorsClick(this)\' />[' + i + ']\
                <ul>\
                    <li>权重：<input type=\'number\' onchange=\'OnActorWeightChange(this)\' value=\'' + Actor.Weight + '\'></li>\
                    <li>Class:' + NewClassContent + '</li>\
                    <li>Transform:\
                        <ul>\
                            <li>位置：<input type=\'text\' value=\'[' + Translation.X + ',' + Translation.Y + ',' + Translation.Z + ']\' onchange=\'OnActorTranslationChange(this)\' /></li>\
                            <li>旋转：<input type=\'text\' value=\'[' + Rotation.X + ',' + Rotation.Y + ',' + Rotation.Z + ',' + Rotation.W + ']\' onchange=\'OnActorRotationChange(this)\' /></li>\
                            <li>缩放：<input type=\'text\' value=\'[' + Scale3D.X + ',' + Scale3D.Y + ',' + Scale3D.Z + ']\' onchange=\'OnActorScale3DChange(this)\' /></li>\
                        </ul>\
                    <li>\
                </ul>\
            </li >\r\n'
        }
    }

    if (!Actors || Actors.length <= 0) {
        Content += '<li>无</li>\r\n'
    }
    ModifiesActorsListElement.innerHTML = Content
}

// 检查选中
function CheckSelected(e) {
    let Index = -1

    let j = 0;
    let Elements = e.parentElement.getElementsByTagName('li')
    for (let i = 0; i < Elements.length; i++) {
        let Element = Elements[i]
        if (Element.parentElement == e.parentElement) {
            if (Element == e) {
                Index = j

                Element.classList.add('Selected')
            }
            else {

                Element.classList.remove('Selected')
            }
            ++j;
        }
    }

    return Index
}

// 获取点击下标
function GetClickIndex(e) {
    let j = 0;
    let Elements = e.parentElement.parentElement.getElementsByTagName('li')
    for (let i = 0; i < Elements.length; i++) {
        let Element = Elements[i]
        if (Element.parentElement == e.parentElement.parentElement) {
            if (Element == e.parentElement) {
                return j
            }
            ++j;
        }
    }

    return -1
}

// 添加图层点击事件
function AddLayerClick(e) {
    let Index = 0
    while (true) {
        ++Index;

        let bIsExists = false
        let NewName = 'undefined_' + Index
        for (let i = 0; i < MapData.length; i++) {
            let LayerData = MapData[i]
            if (LayerData.Name === NewName) {
                bIsExists = true
                break
            }
        }

        if (!bIsExists) {

            MapData.push({ Name: NewName, AttributeSet: [] })

            SaveMapData()

            UpdateLayersList()

            break
        }
    }
}

// 删除图层点击事件
function DeleteLayerClick(e) {
    if (!MapData) {
        return
    }

    let Index = GetClickIndex(e)
    MapData.splice(Index, 1)

    SaveMapData()

    if (CurrentLayerIndex === Index) {
        CurrentLayerIndex = -1
        CurrentAttributeSetIndex = -1
        CurrentModifiesIndex = -1
        CurrentModifiesFlagsIndex = -1
        CurrentModifiesActorsIndex = -1

        SaveEditState()
    }
    else if (CurrentLayerIndex > Index) {
        --CurrentLayerIndex

        SaveEditState()
    }

    UpdateLayersList()

    event.stopPropagation()
}

// 添加属性点击事件
function AddAttributeSetClick(e) {
    let AttributeSet = GetCurrentAttributeSet()
    if (!AttributeSet) {
        return
    }

    AttributeSet.push({ Coordinates: [], Modifies: [] })

    SaveMapData()

    UpdateAttributeSetList()
}

// 删除属性点击事件
function DeleteAttributeSetClick(e) {
    let AttributeSet = GetCurrentAttributeSet()
    if (!AttributeSet) {
        return
    }

    let Index = GetClickIndex(e)
    AttributeSet.splice(Index, 1)

    SaveMapData()

    if (CurrentAttributeSetIndex === Index) {
        CurrentAttributeSetIndex = -1
        CurrentModifiesIndex = -1
        CurrentModifiesFlagsIndex = -1
        CurrentModifiesActorsIndex = -1

        SaveEditState()
    }
    else if (CurrentAttributeSetIndex > Index) {
        --CurrentAttributeSetIndex

        SaveEditState()
    }

    UpdateAttributeSetList()

    event.stopPropagation()
}

// 添加坐标点击事件
function AddCoordinatesClick(e) {
    let Coordinates = GetCurrentCoordinates()
    if (!Coordinates) {
        return
    }

    Coordinates.push({ X: 0, Y: 0, Z: 0 })

    UpdateCoordinatesList()
}

// 删除坐标点击事件
function DeleteCoordinatesClick(e) {
    let Coordinates = GetCurrentCoordinates()
    if (!Coordinates) {
        return
    }

    let Index = GetClickIndex(e)
    Coordinates.splice(Index, 1)

    SaveMapData()

    UpdateCoordinatesList()
}

// 坐标改变事件
function OnCoordinatesChange(e) {
    let Coordinates = GetCurrentCoordinates()
    if (!Coordinates) {
        return
    }

    let Index = GetClickIndex(e)
    let Coordinate = Coordinates[Index]
    if (!Coordinate) {
        return
    }

    let Data = null
    try {
        Data = JSON.parse(e.value)
    }
    catch {

    }

    if (Data && Data[0] != undefined && Data[1] != undefined && Data[2] != undefined && Data[0] + Data[1] + Data[2] == 0) {
        Coordinate.X = Data[0]
        Coordinate.Y = Data[1]
        Coordinate.Z = Data[2]

        UpdateCoordinatesList()
    }
    else {
        e.value = '[' + Coordinate.X + ',' + Coordinate.Y + ',' + Coordinate.Z + ']'
    }
}

// 添加属性修改点击事件
function AddModifiesClick(e) {
    let Modifies = GetCurrentModifies()
    if (!Modifies) {
        return
    }

    Modifies.push({ bRandomSet: false, RandomNumber: 0, RandomDeviation: 0, Flags: [], Actors: [] })

    SaveMapData()

    UpdateModifiesList()
}

// 删除属性修改事件
function DeleteModifiesClick(e) {
    let Modifies = GetCurrentModifies()
    if (!Modifies) {
        return
    }

    let Index = GetClickIndex(e)
    Modifies.splice(Index, 1)

    SaveMapData()

    if (CurrentModifiesIndex === Index) {
        CurrentModifiesIndex = -1
        CurrentModifiesFlagsIndex = -1
        CurrentModifiesActorsIndex = -1

        SaveEditState()
    }
    else if (CurrentModifiesIndex > Index) {
        --CurrentModifiesIndex

        SaveEditState()
    }

    UpdateModifiesList()

    event.stopPropagation()
}

// 添加属性修改Flags点击事件
function AddModifiesFlagsClick(e) {
    let Flags = GetCurrentFlags()
    if (!Flags) {
        return
    }

    Flags.push({ Weight: 0, Flags: 0 })

    SaveMapData()

    DrawHexes()

    UpdateModifiesFlagsList()
}

// 删除属性修改Flags点击事件
function DeleteModifiesFlagsClick(e) {
    let Flags = GetCurrentFlags()
    if (!Flags) {
        return
    }

    let Index = GetClickIndex(e)
    Flags.splice(Index, 1)

    SaveMapData()

    DrawHexes()

    if (CurrentModifiesFlagsIndex === Index) {
        CurrentModifiesFlagsIndex = -1

        SaveEditState()
    }
    else if (CurrentModifiesFlagsIndex > Index) {
        --CurrentModifiesFlagsIndex

        SaveEditState()
    }

    UpdateModifiesFlagsList()

    event.stopPropagation()
}

// 添加属性修改Actors点击事件
function AddModifiesActorsClick(e) {
    let Actors = GetCurrentActors()
    if (!Actors) {
        return
    }

    Actors.push({ Weight: 0, ActorClass: "", SpawnTransform: { Rotation: { X: 0, Y: 0, Z: 0, W: 1 }, Translation: { X: 0, Y: 0, Z: 0 }, Scale3D: { X: 1, Y: 1, Z: 1 } } })

    SaveMapData()

    DrawHexes()

    UpdateModifiesActorsList()
}

// 删除属性修改Actors点击事件
function DeleteModifiesActorsClick(e) {
    let Actors = GetCurrentActors()
    if (!Actors) {
        return
    }

    let Index = GetClickIndex(e)
    Actors.splice(Index, 1)

    SaveMapData()

    DrawHexes()

    if (CurrentModifiesActorsIndex === Index) {
        CurrentModifiesActorsIndex = -1

        SaveEditState()
    }
    else if (CurrentModifiesActorsIndex > Index) {
        --CurrentModifiesActorsIndex

        SaveEditState()
    }

    UpdateModifiesActorsList()

    event.stopPropagation()
}

// 画布点击事件
function CanvasClick(e) {
    let Coordinates = GetCurrentCoordinates()
    for (let [key, value] of HexGenerator.Hexes) {
        let Hex = value
        let Position = Hex.Position
        if (IsCollision(e.offsetX, e.offsetY, Position.X, Position.Y, Hex.OR, Hex.IR)) {
            let bHaveCoorinate = false

            let Coordinate = Hex.Coordinate
            for (let i = 0; i < Coordinates.length; i++) {
                if (Coordinates[i].X === Coordinate.X &&
                    Coordinates[i].Y === Coordinate.Y &&
                    Coordinates[i].Z === Coordinate.Z) {
                    Coordinates.splice(i, 1)
                    bHaveCoorinate = true
                    break
                }
            }

            if (!bHaveCoorinate) {
                Coordinates.push(Coordinate)
            }

            SaveMapData()
        }
    }

    UpdateCoordinatesList()
}

// 图层失去焦点事件
function OnLayerBlur(e) {
    // 获取当前点击下标
    let Index = GetClickIndex(e)

    // 名称未更改
    let NewName = e.value
    var LayerData = MapData[Index]
    if (!LayerData || LayerData.Name === NewName) {
        return
    }

    // 重复名称
    for (let i = 0; i < MapData.length; i++) {
        if (MapData[i].Name === NewName) {
            e.value = LayerData.Name
            return
        }
    }

    LayerData.Name = NewName

    SaveMapData()
}

// 图层点击事件
function OnLayersClick(e) {
    let Index = CheckSelected(e)
    if (CurrentLayerIndex !== Index) {
        CurrentLayerIndex = Index
        CurrentAttributeSetIndex = -1
        CurrentModifiesIndex = -1
        CurrentModifiesFlagsIndex = -1
        CurrentModifiesActorsIndex = -1

        SaveEditState()

        UpdateAttributeSetList()
    }
}

// 属性集合点击事件
function OnAttributeSetClick(e) {
    let Index = CheckSelected(e)
    if (CurrentAttributeSetIndex !== Index) {
        CurrentAttributeSetIndex = Index
        CurrentModifiesIndex = -1
        CurrentModifiesFlagsIndex = -1
        CurrentModifiesActorsIndex = -1

        SaveEditState()

        // 更新属性列表Html
        UpdateCoordinatesList()
        UpdateModifiesList()
    }
}

// 属性修改点击事件
function OnModifiesListClick(e) {
    let Index = CheckSelected(e)
    if (CurrentModifiesIndex !== Index) {
        CurrentModifiesIndex = Index
        CurrentModifiesFlagsIndex = -1
        CurrentModifiesActorsIndex = -1

        SaveEditState()

        UpdateModifiesFlagsList()
        UpdateModifiesActorsList()
    }
}

// 随机集合点击事件
function OnRandomSetClick(e) {
    OnModifiesListClick(e.parentElement.parentElement.parentElement)

    let Motify = GetCurrentModify()
    if (Motify) {
        Motify.bRandomSet = e.checked

        SaveMapData()
    }
}

// 随机数量失去焦点事件
function OnRandomNumberBlur(e) {
    let Motify = GetCurrentModify()
    if (Motify) {
        Motify.RandomNumber = parseInt(e.value)

        SaveMapData()
    }
}

// 随机区间失去焦点事件
function OnRandomDeviationBlur(e) {
    let Motify = GetCurrentModify()
    if (Motify) {
        Motify.RandomDeviation = parseInt(e.value)

        SaveMapData()
    }
}

// 属性修改Flags点击事件
function OnModifiesFlagsListClick(e) {
    let Index = CheckSelected(e)
    if (CurrentModifiesFlagsIndex !== Index) {
        CurrentModifiesFlagsIndex = Index

        SaveEditState()
    }
}

// 属性修改Actors点击事件
function OnModifiesActorsListClick(e) {
    let Index = CheckSelected(e)
    if (CurrentModifiesActorsIndex !== Index) {
        CurrentModifiesActorsIndex = CheckSelected(e)

        SaveEditState()
    }
}

// Actors权重改变事件
function OnActorWeightChange(e) {
    let Actor = GetCurrentActor()
    if (Actor) {
        Actor.Weight = parseInt(e.value)

        SaveMapData()

        DrawHexes()
    }
    else {
        alert("获取当前Actors数据错误")
    }
}

// Actor Class选择事件
function OnClassSelect(e) {
    let Actor = GetCurrentActor()
    if (Actor) {
        Actor.Class = e.value

        SaveMapData()

        DrawHexes()
    }
    else {
        alert("获取当前Actors数据错误")
    }
}

// Actor位置改变事件
function OnActorTranslationChange(e) {
    let Actor = GetCurrentActor()
    if (Actor) {
        let Translation = Actor.SpawnTransform.Translation

        let Data = null
        try {
            Data = JSON.parse(e.value)
        }
        catch {

        }

        if (Data && Data[0] != undefined && Data[1] != undefined && Data[2] != undefined) {
            Translation.X = Data[0]
            Translation.Y = Data[1]
            Translation.Z = Data[2]

            SaveMapData()
        }
        else {
            e.value = '[' + Translation.X + ',' + Translation.Y + ',' + Translation.Z + ']'
        }
    }
    else {
        alert("获取当前Actors数据错误")
    }
}

// Actor旋转改变事件
function OnActorRotationChange(e) {
    let Actor = GetCurrentActor()
    if (Actor) {
        let Rotation = Actor.SpawnTransform.Rotation

        let Data = null
        try {
            Data = JSON.parse(e.value)
        }
        catch {

        }

        if (Data && Data[0] != undefined && Data[1] != undefined && Data[2] != undefined && Data[3] != undefined) {
            Rotation.X = Data[0]
            Rotation.Y = Data[1]
            Rotation.Z = Data[2]
            Rotation.W = Data[3]

            SaveMapData()
        }
        else {
            e.value = '[' + Rotation.X + ',' + Rotation.Y + ',' + Rotation.Z + ']'
        }
    }
    else {
        alert("获取当前Actors数据错误")
    }
}

// Actor缩放改变事件
function OnActorScale3DChange(e) {
    let Actor = GetCurrentActor()
    if (Actor) {
        let Scale3D = Actor.SpawnTransform.Scale3D

        let Data = null
        try {
            Data = JSON.parse(e.value)
        }
        catch {

        }

        if (Data && Data[0] != undefined && Data[1] != undefined && Data[2] != undefined) {
            Scale3D.X = Data[0]
            Scale3D.Y = Data[1]
            Scale3D.Z = Data[2]

            SaveMapData()
        }
        else {
            e.value = '[' + Scale3D.X + ',' + Scale3D.Y + ',' + Scale3D.Z + ']'
        }
    }
    else {
        alert("获取当前Actors数据错误")
    }
}

// Flags权重改变事件
function OnFlagWeightChange(e) {
    let Flag = GetCurrentFlag()
    if (Flag) {

        Flag.Weight = parseInt(e.value)

        SaveMapData()

        DrawHexes()
    }
    else {
        alert("获取当前Flags数据错误")
    }
}

// Flags改变事件
function OnFlagFlagsClick(e) {
    OnModifiesFlagsListClick(e.parentElement.parentElement.parentElement)

    let Flag = GetCurrentFlag()
    if (Flag) {

        let Value = 0

        let ClickName = e.name
        switch (ClickName) {
            case "NoCreated":
                Value = EHexFlag.NoCreated;
                break
            case "NoMoved":
                Value = EHexFlag.NoMoved;
                break
            case "NoInfantry":
                Value = EHexFlag.NoInfantry;
                break
            case "NoVehicle":
                Value = EHexFlag.NoVehicle;
                break
            case "NoAircraft":
                Value = EHexFlag.NoAircraft;
                break
        }

        let bChecked = e.checked
        if (bChecked) {
            Flag.Flags |= Value
        }
        else {
            Flag.Flags &= ~Value
        }

        SaveMapData()

        DrawHexes()
    }
    else {
        alert("获取当前Flags数据错误")
    }
}

// 导入配置
function ImportConfigChange(e) {
    if (e.files && e.files[0]) {

        ConfigFilename = e.files[0].name

        var Reader = new FileReader();
        Reader.readAsText(e.files[0], 'UTF-8');//发起异步请求
        Reader.onload = function (e) {
            CurrentAttributeSetIndex = -1
            CurrentModifiesIndex = -1
            CurrentModifiesFlagsIndex = -1
            CurrentModifiesActorsIndex = -1

            SaveEditState()

            let Content = e.target.result
            try {
                MapData = JSON.parse(Content)

                SaveMapData()
            }
            catch (e) {
                MapData = []
                ConfigFilename = 'undefined.json'

                SaveMapData()

                alert("配置文件错误！")
            }

            UpdateLayersList()
            UpdateAttributeSetList()

            DrawHexes()
        }
    }
}

// 导出配置
function ExportConfigClick(e) {
    let ConfigBlob = new Blob([JSON.stringify(MapData, null, '  ')]);
    let Link = document.getElementById('DownloadConfig')
    Link.href = URL.createObjectURL(ConfigBlob);            //  创建一个URL对象并传给a的href
    Link.download = ConfigFilename;                         //  设置下载的默认文件名
    Link.click();
}

// 清除数据
function ClearData(e) {
    CurrentLayerIndex = -1
    CurrentAttributeSetIndex = -1
    CurrentModifiesIndex = -1
    CurrentModifiesFlagsIndex = -1
    CurrentModifiesActorsIndex = -1

    SaveEditState()

    MapData = []

    SaveMapData()

    UpdateLayersList()
}