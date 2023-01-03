import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import CANNON from 'cannon'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry  } from 'three/examples/jsm/geometries/TextGeometry'
import { generateUUID } from 'three/src/math/MathUtils'
import { MaxEquation } from 'three'

// Params /////
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const cursor = {
    x: 0,
    y: 0
}

const GameState = {
    none: "none",
    rollDice: "rollDice",
    clickNums: "clickNums",
    win: "win",
    lose: "lose"
}

let currentGameState = null
setGameState(GameState.rollDice)

let raycastObjects = []

let numbersDown = []
let numbersDownThisTurn = []
let numTiles = []

let dice1Body, dice2Body, dice1Obj, dice2Obj, dice1Result, dice2Result
let targetNum, numofNumBoxes, dice1RolledFlag, dice2RolledFlag, diceRolledNum, dice1NumFlag, dice2NumFlag, dice1NumAnimStart, dice2NumAnimStart
let dice1TextGeo, dice2TextGeo, dice1TextMesh, dice2TextMesh

numofNumBoxes = 9

// Scene /////
const scene = new THREE.Scene()

// Loaders /////
const loadingManager = new THREE.LoadingManager()
loadingManager.onStart = () => { console.log("Loading started") }
loadingManager.onLoad = () => { console.log("Loading finished") }
loadingManager.onProgress = () => { console.log("Loading progressing") }
loadingManager.onError = () => { console.log("Loading error") }

const textureLoader = new THREE.TextureLoader(loadingManager)
const goldMatcap = textureLoader.load('/textures/matcap/gold.png')
const redMatcap = textureLoader.load('/textures/matcap/red.png')

const plywoodColourTex = textureLoader.load('/textures/plywood/colour.jpg')
const plywoodAOTex = textureLoader.load('/textures/plywood/ao.jpg')
const plywoodNormalTex = textureLoader.load('/textures/plywood/normal.jpg')
const plywoodHeightTex = textureLoader.load('/textures/plywood/height.png')
const plywoodRougnessTex = textureLoader.load('/textures/plywood/roughness.jpg')

const bookColourTex = textureLoader.load('/textures/book/colour.jpg')
const bookAOTex = textureLoader.load('/textures/book/ao.jpg')
const bookNormalTex = textureLoader.load('/textures/book/normal.jpg')
const bookHeightTex = textureLoader.load('/textures/book/height.jpg')
const bookRoughnessTex = textureLoader.load('/textures/book/roughness.jpg')

const fabricColourTex = textureLoader.load('/textures/fabric/colour.jpg')
const fabricAOTex = textureLoader.load('/textures/fabric/ao.jpg')
const fabricNormalTex = textureLoader.load('/textures/fabric/normal.jpg')
const fabricHeightTex = textureLoader.load('/textures/fabric/height.png')
const fabricRoughnessTex = textureLoader.load('/textures/fabric/roughness.jpg')

const diceTexture = [
    new THREE.MeshStandardMaterial( { map: textureLoader.load('/textures/dice/4.png') } ),
    new THREE.MeshStandardMaterial( { map: textureLoader.load('/textures/dice/3.png') } ),
    new THREE.MeshStandardMaterial( { map: textureLoader.load('/textures/dice/1.png') } ),
    new THREE.MeshStandardMaterial( { map: textureLoader.load('/textures/dice/6.png') } ),
    new THREE.MeshStandardMaterial( { map: textureLoader.load('/textures/dice/5.png') } ),
    new THREE.MeshStandardMaterial( { map: textureLoader.load('/textures/dice/2.png') } )
];
diceTexture.name = "dice"

let helvetikerFont
const fontLoader = new FontLoader()
fontLoader.load('/fonts/helvetiker_regular.typeface.json', function (response){
    helvetikerFont = response
})

// Materials /////
const redFloor = new THREE.Color(0xe85959)
const greenFloor = new THREE.Color(0x0cad00)
const blueFloor = new THREE.Color(0x2a84f8)

const wallMaterial = new THREE.MeshStandardMaterial( { transparent: true, opacity: 0.4, color: 0x70a1ff } )
const planeMat = new THREE.MeshStandardMaterial( { color: 0x066304 } )
const transparentMat = new THREE.MeshPhongMaterial( { transparent: true, opacity: 0 })
const goldMatcapMaterial = new THREE.MeshMatcapMaterial({matcap: goldMatcap})
const redMatcapMaterial = new THREE.MeshMatcapMaterial({matcap: redMatcap})
const normalMaterial = new THREE.MeshNormalMaterial()

const plywoodMaterial = new THREE.MeshStandardMaterial({
    map: plywoodColourTex,
    aoMap: plywoodAOTex,
    aoMapIntensity: 1,
    normalMap: plywoodNormalTex,
    roughnessMap: plywoodRougnessTex,
    roughness: 1.5
})

const bookMaterial = new THREE.MeshStandardMaterial({
    map: bookColourTex,
    aoMap: bookAOTex,
    aoMapIntensity: 1,
    normalMap: bookNormalTex,
    roughnessMap: bookRoughnessTex,
    roughness: 0.8
})

const fabricMaterial = new THREE.MeshStandardMaterial({
    map: fabricColourTex,
    aoMap: fabricAOTex,
    aoMapIntensity: 1,
    normalMap: fabricNormalTex,
    roughnessMap: fabricRoughnessTex,
    roughness: 0.8,
    color: greenFloor
})

// Lights ///// 
const light = new THREE.PointLight( 0xffffff, 0.65, 100 )
light.position.set(-5,4,5)
light.castShadow = true
scene.add(light)

const light2 = new THREE.PointLight( 0xeccc68, 0.7, 100 )
light2.position.set(4,3,3)
light2.castShadow = true
scene.add(light2)

const light3 = new THREE.PointLight( 0xeccc68, 0.4, 100 )
light3.position.set(-5,-4,-5)
light3.castShadow = true
scene.add(light3)

const light4 = new THREE.PointLight( 0xeccc68, 0.65, 100 )
light4.position.set(4,-3,3)
light4.castShadow = true
scene.add(light4)

const light5 = new THREE.PointLight( 0xeccc68, 0.65, 100 )
light5.position.set(0,3,0)
light5.castShadow = true
scene.add(light5)

const hemiLight = new THREE.HemisphereLight(0x9be4fa, 0xfa9be5, 0.15)
scene.add(hemiLight)

const spotLight1 = new THREE.SpotLight(0xfff5b6, 1.5, 10, Math.PI * 0.03, 0.25, 1)
spotLight1.position.set(2, 6, 4)
spotLight1.castShadow = true
spotLight1.target.position.y = 10
scene.add(spotLight1)
scene.add(spotLight1.target)

const spotLight2 = new THREE.SpotLight(0xfff5b6, 1.5, 10, Math.PI * 0.03, 0.25, 1)
spotLight2.position.set(-2, 6, 4)
spotLight2.castShadow = true
spotLight2.target.position.y = 10
scene.add(spotLight2)
scene.add(spotLight2.target)

// Camera /////
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 5
camera.position.y = 2.5
camera.lookAt(new THREE.Vector3(0,0,0))
scene.add(camera)

// Renderer
const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.shadowMap.enabled = true

// Post Processing /////
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const renderPass = new RenderPass(scene,camera)
effectComposer.addPass(renderPass)

// GUI /////
const gui = new dat.GUI()
const debugObject = { color: 0xff0000}
debugObject.diceVelocityThreshold = 0.01
gui.addColor(debugObject, 'color').name("Fabric colour").onChange(()=>{
    fabricMaterial.color.set(debugObject.color)
})
gui.add(hemiLight, 'intensity').min(0).max(1)


// Controls /////
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true
//orbitControls.maxPolarAngle = Math.PI / 2.3;     //Restricts the cameras vertical rotation so you cant see under the plane
//orbitControls.enablePan = false
//orbitControls.enableZoom = false

const raycaster = new THREE.Raycaster()
let currentIntersect = null
let mouse = new THREE.Vector2()

// Objects /////


const wallGeo = new THREE.BoxGeometry(1,1,1)
const diceGeo = new THREE.BoxGeometry(1,1,1)
const bigDice = new THREE.Mesh(diceGeo, diceTexture)
scene.add(bigDice)
bigDice.position.x = 4
bigDice.position.y = 1
bigDice.position.z = 1
bigDice.name = 'bigDice'
raycastObjects.push(bigDice)

// Physics /////
const world = new CANNON.World()
world.gravity.set(0, -9.81, 0)
world.broadphase = new CANNON.SAPBroadphase(world)

const objectsToUpdate = []

const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.5
    }
)
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial

const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body({
    mass: 0,
    shape: floorShape
})
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5)
floorBody.position.y = -0.5
world.addBody(floorBody)

createStaticBox(6.1, 0.7, 0.1, {x:-0.25, y:-0.25, z: 2.5}, plywoodMaterial)   //front
createStaticBox(6.1, 0.7, 0.1, {x:-0.25, y:-0.25, z: -0.5}, plywoodMaterial)  //back
createStaticBox(0.1, 0.7, 2.9, {x:2.75, y:-0.25, z:1}, plywoodMaterial)       //right
createStaticBox(0.12, 0.5, 2.9, {x:2.64, y:-0.25, z:1}, plywoodMaterial)      //rightInside
createStaticBox(0.1, 0.7, 2.9, {x:-3.25, y:-0.25, z:1}, plywoodMaterial)      //left
createStaticBox(0.12, 0.5, 2.9, {x:-3.14, y:-0.25, z:1}, plywoodMaterial)     //leftInside
createStaticBox(5.9, 0.1, 2.9, {x:-0.25, y:-0.55, z:1}, fabricMaterial)         //Floor
createStaticBox(5.9, 1, 0.1, {x:-0.25, y:0, z: 0.2}, transparentMat)

let numTilesCreated = false

// Update /////
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Animations /////
    bigDice.rotation.y += 1 * deltaTime
    bigDice.rotation.x += 1 * deltaTime

    if(dice1NumFlag){
        if(elapsedTime >= dice1NumAnimStart + 2.4){
            dice1TextMesh.position.x = 0.5
            dice1TextMesh.position.y = 1.5
            dice1TextMesh.position.z = -0.5
            dice1NumFlag = false
        }
    }
    if(dice2NumFlag){
        if(elapsedTime >= dice2NumAnimStart + 2.4){
            dice2TextMesh.position.x = -0.5
            dice2TextMesh.position.y = 1.5
            dice2TextMesh.position.z = -0.5
            dice2NumFlag = false
        }
    }

    // Mouse input/////
    raycaster.setFromCamera(mouse,camera)
    const objectsToTest = raycastObjects
    const intersects = raycaster.intersectObjects(objectsToTest)

    if(helvetikerFont && !numTilesCreated){
        createNumTiles()
        numTilesCreated = true
    }

    if(intersects.length){
        if(!currentIntersect){
            //console.log("Mouse enter ", intersects[0].object.name)
        }
        currentIntersect = intersects[0]
    }
    else{
        if(currentIntersect){
            //console.log("mouse leave ", currentIntersect.object.name)
        }
        currentIntersect = null
    }

    if(dice1RolledFlag){        
        if(Math.abs(dice1Body.velocity.x) <= debugObject.diceVelocityThreshold && Math.abs(dice1Body.velocity.z) <= debugObject.diceVelocityThreshold){
            let localUp = new CANNON.Vec3()
            let inverseBodyOr = new CANNON.Quaternion()
            let limit = Math.sin(Math.PI / 4)

            localUp.set(0,1,0)
            dice1Body.quaternion.inverse(inverseBodyOr)
            inverseBodyOr.vmult(localUp, localUp)

            if(localUp.x > limit){
                diceRolled(1, 4)
            } else if(localUp.x < -limit){
                diceRolled(1, 3)
            } else if(localUp.y > limit){
                diceRolled(1, 1)
            } else if(localUp.y < -limit){
                diceRolled(1, 6)
            } else if(localUp.z > limit){
                diceRolled(1, 5)
            } else if(localUp.z < -limit){
                diceRolled(1, 2)
            } else {
                console.log("Dice 1 is not flat")
            }
        }
        spotLight1.target.position.copy(dice1Body.position)
    }

    if(dice2RolledFlag){
        if(Math.abs(dice2Body.velocity.x) <= debugObject.diceVelocityThreshold && Math.abs(dice2Body.velocity.z) <= debugObject.diceVelocityThreshold){
            console.log("Dice 2 start")
            let localUp = new CANNON.Vec3()
            let inverseBodyOr = new CANNON.Quaternion()
            let limit = Math.sin(Math.PI / 4)

            localUp.set(0,1,0)
            dice2Body.quaternion.inverse(inverseBodyOr)
            inverseBodyOr.vmult(localUp, localUp)

            if(localUp.x > limit){
                diceRolled(2, 4)
            } else if(localUp.x < -limit){
                diceRolled(2, 3)
            } else if(localUp.y > limit){
                diceRolled(2, 1)
            } else if(localUp.y < -limit){
                diceRolled(2, 6)
            } else if(localUp.z > limit){
                diceRolled(2, 5)
            } else if(localUp.z < -limit){
                diceRolled(2, 2)
            } else {
                console.log("Dice 2 is not flat")
            }
        }
        spotLight2.target.position.copy(dice2Body.position)
    }

    world.step(1 / 60, deltaTime, 3)

    objectsToUpdate.forEach(element => {
        element.mesh.position.copy(element.body.position)
        element.mesh.quaternion.copy(element.body.quaternion)
    });

    orbitControls.update()
    renderer.render(scene,camera)
    effectComposer.render()
    window.requestAnimationFrame(tick)
}

tick()

let totalThisTurn
let totalDownThisTurn
let totalThisGame = 0
let tilesDown = []
let numsLeft = [1,2,3,4,5,6,7,8,9]

function numDown2(num){
    if(currentGameState == GameState.clickNums){
        let currentTile = numTiles[num-1]   //Gets the current tile object from the numTiles array (num is 1-9, array is 0-8, hence -1)
        if(!currentTile.userData.fixedPosition){    //if the current tile position is not fixed (used in a previous turn)
            if(currentTile.userData.isDown){    //If the selected tile is already down
                currentTile.position.y += 0.4
                currentTile.userData.isDown = !currentTile.userData.isDown
    
                totalThisTurn -= num
                totalDownThisTurn--
                //totalLeft += num
    
                const index = tilesDown.indexOf(currentTile)
                tilesDown.splice(index, 1)
                
            }
            else if(!currentTile.userData.isDown && totalDownThisTurn < 2){       //if the selected tile is up
                currentTile.position.y -= 0.4
                currentTile.userData.isDown = !currentTile.userData.isDown
    
                totalThisTurn += num
                totalDownThisTurn++
                //totalLeft -= num

                tilesDown.push(currentTile)
            }
            //console.log("Total remaining: ", totalLeft)
    
            if(totalThisTurn == targetNum){
                console.log("Target num reached")
                setGameState(GameState.rollDice)
                tilesDown.forEach(element => {
                    element.userData.fixedPosition = true
                });

                if(tilesDown.length == 9){
                    gameWon()
                }
            }
        }
        else{
            console.log("Tile position has been fixed")
        }
        
    }
    else{
        console.log("Cannot click nums now.")
    }
}

function gameWon(){
    setGameState(GameState.win)
    console.log("You have won!!!")
}

function evaluateDiceValue(dice){
    if(dice == 1){
        dice = dice1Body
    }
    else if(dice == 2){
        dice = dice2Body
    }

    if(Math.abs(dice.velocity.x) <= debugObject.diceVelocityThreshold && Math.abs(dice.velocity.z) <= debugObject.diceVelocityThreshold){
        let localUp = new CANNON.Vec3()
        let inverseBodyOr = new CANNON.Quaternion()
        let limit = Math.sin(Math.PI / 4)

        localUp.set(0,1,0)
        dice.quaternion.inverse(inverseBodyOr)
        inverseBodyOr.vmult(localUp, localUp)

        if(localUp.x > limit){
            diceRolled(1, 4)
        } else if(localUp.x < -limit){
            diceRolled(1, 3)
        } else if(localUp.y > limit){
            diceRolled(1, 1)
        } else if(localUp.y < -limit){
            diceRolled(1, 6)
        } else if(localUp.z > limit){
            diceRolled(1, 5)
        } else if(localUp.z < -limit){
            diceRolled(1, 2)
        } else {
            console.log("Dice 1 is not flat")
        }
    }
}

function resetGame(){
    numbersDown = []
}

function setGameState(state){
    currentGameState = state
    console.log("Game state set to: ", currentGameState)
}

function diceRolled(diceNum, result){   //Called when a dice stops rolling
    if(diceNum == 1){
        console.log("Dice 1: ",result)
        dice1Result = result
        dice1RolledFlag = false
        diceRolledNum++

        dice1TextGeo = new TextGeometry(result.toString(), {
            font: helvetikerFont,
            size: 0.8,
            height: 0.2
        })
        dice1TextGeo.center()
        dice1TextMesh = new THREE.Mesh(dice1TextGeo, normalMaterial)
        scene.add(dice1TextMesh)
        dice1TextMesh.position.copy(dice1Obj.position)
        dice1TextMesh.position.y += 1
        dice1TextMesh.name = "dice1Text:" + result
        dice1NumFlag = true
        dice1NumAnimStart = clock.getElapsedTime()
    }
    else if(diceNum == 2){
        console.log("Dice 2: ",result)
        dice2Result = result
        dice2RolledFlag = false
        diceRolledNum++

        dice2TextGeo = new TextGeometry(result.toString(), {
            font: helvetikerFont,
            size: 0.8,
            height: 0.2
        })
        dice2TextGeo.center()
        dice2TextMesh = new THREE.Mesh(dice2TextGeo, normalMaterial)
        scene.add(dice2TextMesh)
        dice2TextMesh.position.copy(dice2Obj.position)
        dice2TextMesh.position.y += 1
        dice2TextMesh.name = "dice2Text:" + result
        dice2NumFlag = true
        dice2NumAnimStart = clock.getElapsedTime()
    }

    if(diceRolledNum == 2){
        targetNum = dice1Result + dice2Result
        console.log("Both dice rolled. Target num: ", targetNum)

        //if(totalLeft)

        setGameState(GameState.clickNums)
    }
}

function rollDice(){
    if(currentGameState == GameState.rollDice){
        setGameState(GameState.none)    //Disable controls while dice are rolling
        
        debugObject.reset()     //Remove current dice
        dice1Body = createDie(0.3,0.3,0.3, {x:2, y:1, z:1}, 1)      //Create new dice
        dice2Body = createDie(0.3,0.3,0.3, {x:2, y:1.5, z:1.5}, 2)
        dice1Obj = scene.getObjectByName("dice1")                   //Set dice obj refs to new dice
        dice2Obj = scene.getObjectByName("dice2")
        applyDiceForce()                            //Apply force to new dice
        dice1RolledFlag = true                      //Set flags to test for dice stopping
        dice2RolledFlag = true
        diceRolledNum = 0                           //Set number of completed dice rolls to 0 (incremented when a dice stops rolling)

        totalThisTurn = 0
        totalDownThisTurn = 0
        numsLeft = [1,2,3,4,5,6,7,8,9]         //Used to calculate if the remaining tiles can reach the target

        scene.remove(dice1TextMesh)
        scene.remove(dice2TextMesh)
    }
    else{
        console.log("cannot roll dice now")
    }
}

function applyDiceForce(){
    dice1Body.velocity = new CANNON.Vec3(debugObject.diceVelocityThreshold * 1.01, 0, debugObject.diceVelocityThreshold * 1.01)
    dice2Body.velocity = new CANNON.Vec3(debugObject.diceVelocityThreshold * 1.01, 0, debugObject.diceVelocityThreshold * 1.01)
    dice1Body.applyLocalForce(new CANNON.Vec3(randomInclusive(-150,-200), randomInclusive(0, 100), randomInclusive(-50, 50)), new CANNON.Vec3(0,0,0))
    dice2Body.applyLocalForce(new CANNON.Vec3(randomInclusive(-150,-200), randomInclusive(0, 100), randomInclusive(-50, 50)), new CANNON.Vec3(0,0,0))
    dice1Body.angularVelocity = new CANNON.Vec3(THREE.MathUtils.degToRad(randomInclusive(0,360)),THREE.MathUtils.degToRad(randomInclusive(0,360)),THREE.MathUtils.degToRad(randomInclusive(0,360)))
    dice2Body.angularVelocity = new CANNON.Vec3(THREE.MathUtils.degToRad(randomInclusive(0,360)),THREE.MathUtils.degToRad(randomInclusive(0,360)),THREE.MathUtils.degToRad(randomInclusive(0,360)))
}

function randomInclusive(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// Utils /////
function createNumTiles(){
    const numBoxGeo = new THREE.BoxGeometry(0.5, 1, 0.2)

    const startPosX = -4.5
    const spacing = 0.6
    let count = 1;
    
    for(let i = 0; i < numofNumBoxes;i++){
        const mesh = new THREE.Mesh(numBoxGeo, goldMatcapMaterial)
        mesh.position.x = ( i * spacing ) + ( startPosX * spacing )
        scene.add(mesh)
        raycastObjects.push(mesh)
        mesh.userData = { isNumBox: true, num: count, isDown: false, fixedPosition: false }
        mesh.name = "NumBox" + count
        mesh.receiveShadow = true
        mesh.castShadow = true
        numTiles.push(mesh)
        
        const numGeo = new TextGeometry( count.toString(), {
            font: helvetikerFont,
            size: 0.4,
            height: 0.1
        })
        numGeo.center()
        const numMesh = new THREE.Mesh(numGeo, normalMaterial)
        scene.add(numMesh)
        numMesh.position.copy(mesh.position)
        numMesh.position.y += 0.8
        numMesh.name = "numTileText:" + count
    
        count++
    }
}

function createDie(width, height, depth, position, num){
    console.log("Creating die")
    // Mesh ///
    const dice = new THREE.Mesh(diceGeo, diceTexture)
    dice.scale.set(width, height, depth)
    dice.castShadow = true
    dice.position.copy(position)
    scene.add(dice)
    dice.name = "dice" + num
    dice.castShadow = true
    dice.receiveShadow = true

    // Physics ///
    const diceShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2))
    const diceBody = new CANNON.Body({
        mass: 1,
        shape: diceShape
    })
    diceBody.position.copy(position)
    world.addBody(diceBody)

    objectsToUpdate.push({ mesh: dice, body: diceBody })
    diceBody.userData = {mesh: dice, halfExtents: width / 2}

    return diceBody
}

function createStaticBox(width,height,depth,position, material){
    const wall = new THREE.Mesh(wallGeo, material)
    wall.scale.set(width,height,depth)
    wall.position.copy(position)
    scene.add(wall)
    wall.geometry.setAttribute('uv2', new THREE.BufferAttribute(wall.geometry.attributes.uv.array, 2))
    if(material != transparentMat){     //If this isn't using the transparent material, enable shadows
        wall.castShadow = true
        wall.receiveShadow = true
    }


    const wallShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2))
    const wallBody = new CANNON.Body({
        mass: 0,
        shape: wallShape
    })
    wallBody.position.copy(position)
    world.addBody(wallBody)

    return wall
}

debugObject.createDie = () =>
{
    createDie(0.3, 0.3, 0.3, {
            x: randomInclusive(-1,1),
            y: 1,
            z: randomInclusive(-1,1)
        }
    )
}
gui.add(debugObject, "createDie")

debugObject.reset = () => {
    console.log("reset")
    objectsToUpdate.forEach(element => {
        world.removeBody(element.body)
        scene.remove(element.mesh)
    });
}
gui.add(debugObject, 'reset')

// Events /////
window.addEventListener('resize', (event) => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width/sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = -(event.clientY / sizes.height - 0.5)

    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

window.addEventListener('click', (event) => {
    console.log("Click")
    if(currentIntersect){
        const intersectObject = currentIntersect.object
        if(intersectObject.userData.isNumBox){
            numDown2(intersectObject.userData.num)
            
        }
        else if(intersectObject.name == 'bigDice'){
            rollDice()

        }
    }
})

window.addEventListener('keydown', (event) => {
    if(event.keyCode === 82){
        console.log("R key pressed")
        rollDice()
    }

    switch(event.keyCode){
        case 82:
            console.log("R key pressed")
            rollDice()
            break;
        case 32:
            console.log("Space pressed")
            let vec = new THREE.Vector3()
            camera.getWorldDirection(vec)
            console.log(vec)
    }
})