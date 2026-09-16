const knowledgeData = [
            {
                id: 'k01',
                title: "พ.ร.บ.อุ้มหาย (ม.22) & การบันทึกภาพ-เสียง",
                category: "กฎหมายใหม่",
                icon: "📹",
                description: "หลักเกณฑ์การบันทึกภาพขณะจับกุม และการแจ้งอัยการ/ฝ่ายปกครองทันที",
                rawText: `พ.ร.บ.ป้องกันและปราบปรามการทรมานและการกระทำความสูญหาย พ.ศ. 2565 (ม.22)
1. เจ้าหน้าที่ต้องบันทึกภาพและเสียงอย่างต่อเนื่องตั้งแต่เริ่มควบคุมตัวจนกระทั่งส่งตัวให้พนักงานสอบสวน
2. ต้องแจ้งการควบคุมตัวให้ "พนักงานอัยการ" และ "นายอำเภอ/ฝ่ายปกครองในท้องที่" ทราบทันที
3. หากมีเหตุสุดวิสัย (กล้องเสีย/แบตหมด) ต้องบันทึกเหตุผลลงในบันทึกจับกุมและรายงานผู้บังคับบัญชา`,
                content: `
                    <div class="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-xl mb-4">
                        <h4 class="font-bold text-red-400 flex items-center gap-2 mb-1">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            ข้อบังคับตามกฎหมาย (มาตรา 22) ฝ่าฝืนมีโทษทางอาญาและวินัย
                        </h4>
                        <p class="text-xs text-slate-300">เจ้าหน้าที่ผู้จับกุมต้องปฏิบัติตามขั้นตอนอย่างเคร่งครัด เพื่อให้การจับกุมชอบด้วยกฎหมาย</p>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mt-2">1. การบันทึกภาพและเสียง (Body Camera / มือถือ)</h4>
                    <ul class="list-disc pl-5 space-y-1.5 text-slate-300 text-sm">
                        <li><strong>ต้องบันทึกต่อเนื่อง:</strong> ตั้งแต่เริ่มการควบคุมตัว ขานชื่อ-สกุล แสดงตัว แจ้งสิทธิ จนถึงนำส่งพนักงานสอบสวน</li>
                        <li><strong>กรณีสุดวิสัย:</strong> หากกล้องเสียหรือแบตเตอรี่หมด ต้องรีบใช้โทรศัพท์มือถือเครื่องอื่นบันทึกแทน และระบุสาเหตุลงในบันทึกจับกุมทันที</li>
                    </ul>

                    <h4 class="text-base font-bold text-blue-400 mt-4">2. การแจ้งเหตุควบคุมตัว (ทันที)</h4>
                    <div class="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-sm space-y-2">
                        <p class="font-bold text-amber-400">📌 หน่วยงานที่ต้องแจ้งในท้องที่เกิดเหตุ:</p>
                        <p>1. <strong>พนักงานอัยการ</strong> (สำนักงานอัยการจังหวัด / สำนักงานคดีศาลแขวง)</p>
                        <p>2. <strong>นายอำเภอ / ฝ่ายปกครอง</strong> (ที่ว่าการอำเภอในท้องที่)</p>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mt-4">3. เทมเพลตข้อความส่งแจ้งอัยการ/ฝ่ายปกครอง</h4>
                    <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 space-y-1 select-all">
                        <p>เรียน พนักงานอัยการ / นายอำเภอ...</p>
                        <p>ด้วยเมื่อวันที่ [วัน/เดือน/ปี] เวลาประมาณ [เวลา] น.</p>
                        <p>เจ้าหน้าที่ตำรวจ [ระบุชื่อหน่วย/สภ.] ได้ควบคุมตัว นาย/นาง/น.ส. [ชื่อ-สกุล] อายุ [อายุ] ปี</p>
                        <p>ข้อหา: [ระบุข้อกล่าวหา]</p>
                        <p>สถานที่จับกุม: [สถานที่]</p>
                        <p>สถานที่ควบคุมตัวปัจจุบัน: [สภ./ที่ทำการ]</p>
                        <p>ผู้ควบคุมตัว: [ยศ-ชื่อ-สกุล] โทร [เบอร์โทรศัพท์]</p>
                    </div>
                `
            },
            {
                id: 'k02',
                title: "คำเตือนสิทธิผู้ต้องหา 5 ข้อ (Miranda Rights)",
                category: "ยุทธวิธี",
                icon: "📜",
                description: "การแจ้งสิทธิตาม ป.วิ.อาญา มาตรา 83 และ 84 ในขณะจับกุม",
                rawText: `สิทธิของผู้ถูกจับกุม 5 ข้อ:
1. ท่านมีสิทธิที่จะให้การหรือไม่ให้การก็ได้
2. ถ้อยคำของท่านอาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้
3. ท่านมีสิทธิพบและปรึกษาทนายความหรือผู้ซึ่งจะเป็นทนายความ
4. ท่านมีสิทธิแจ้งให้ญาติหรือผู้ซึ่งท่านไว้วางใจทราบถึงการจับกุม
5. ท่านมีสิทธิได้รับการรักษาพยาบาลโดยเร็วหากมีอาการเจ็บป่วยหรือบาดเจ็บ`,
                content: `
                    <div class="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-xl mb-4">
                        <h4 class="font-bold text-blue-400">ต้องแจ้งสิทธิทันทีขณะเข้าควบคุมตัวต่อหน้ากล้องบันทึกภาพ</h4>
                    </div>

                    <div class="space-y-3">
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">ข้อ 1:</span> ท่านมีสิทธิที่จะให้การหรือไม่ให้การก็ได้
                        </div>
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">ข้อ 2:</span> ถ้อยคำของท่านอาจใช้เป็นพยานหลักฐานในการพิจารณาคดีของศาลได้
                        </div>
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">ข้อ 3:</span> ท่านมีสิทธิพบและปรึกษาทนายความหรือผู้ซึ่งจะเป็นทนายความเป็นการเฉพาะตัว
                        </div>
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">ข้อ 4:</span> ท่านมีสิทธิแจ้งให้ญาติหรือบุคคลที่ท่านไว้วางใจทราบถึงการถูกจับกุมและสถานที่ควบคุมตัว
                        </div>
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">ข้อ 5:</span> ท่านมีสิทธิได้รับการรักษาพยาบาลโดยเร็วเมื่อมีอาการเจ็บป่วยหรือบาดเจ็บ
                        </div>
                    </div>
                `
            },
            {
                id: 'k03',
                title: "พ.ร.บ.อาวุธปืนฯ 2490 & การตั้งข้อหา",
                category: "อาชญากรรม",
                icon: "🔫",
                description: "ปืนมีทะเบียน ปืนเถื่อน ปืนดัดแปลง (Blank Gun) และการพกพาในที่สาธารณะ (ม.8 ทวิ)",
                rawText: `พ.ร.บ.อาวุธปืน เครื่องกระสุนปืนฯ พ.ศ. 2490
- ปืนเถื่อน/ไม่มีทะเบียน (ม.7, 72): จำคุก 1-10 ปี ปรับ 2,000-20,000 บาท
- ปืนมีทะเบียนของผู้อื่น (ม.7, 72 วรรคสอง): จำคุก 6 เดือน - 5 ปี ปรับ 1,000-10,000 บาท
- พกพาอาวุธปืนในที่สาธารณะโดยไม่ได้รับอนุญาต (ม.8 ทวิ, 72 ทวิ): จำคุกไม่เกิน 5 ปี หรือปรับไม่เกิน 10,000 บาท
- ปืนแบลงค์กัน/บีบีกัน ดัดแปลงลำกล้อง: มีสภาพเป็นอาวุธปืนตามกฎหมายทันที`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. การจำแนกฐานความผิดคดีอาวุธปืน</h4>
                    <div class="space-y-3 text-sm text-slate-300">
                        <div class="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                            <p class="font-bold text-red-400">🔴 อาวุธปืนไม่มีเครื่องหมายทะเบียน (ปืนเถื่อน / ปืนไทยประดิษฐ์)</p>
                            <p class="text-xs text-slate-300 mt-1">ข้อหา: มีอาวุธปืนและเครื่องกระสุนปืนไว้ในครอบครองโดยไม่ได้รับอนุญาต (ม.7, ม.72 วรรคหนึ่ง)</p>
                            <p class="text-xs text-amber-400 mt-1 font-semibold">อัตราโทษ: จำคุก 1 - 10 ปี และปรับ 2,000 - 20,000 บาท</p>
                        </div>
                        <div class="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400">🟡 อาวุธปืนมีทะเบียนของผู้อื่น (ปืนผิดมือ)</p>
                            <p class="text-xs text-slate-300 mt-1">ข้อหา: มีอาวุธปืนของผู้อื่นซึ่งได้รับอนุญาตให้มีและใช้ไว้ในครอบครองโดยไม่ได้รับอนุญาต (ม.7, ม.72 วรรคสอง)</p>
                            <p class="text-xs text-amber-400 mt-1 font-semibold">อัตราโทษ: จำคุก 6 เดือน - 5 ปี และปรับ 1,000 - 10,000 บาท</p>
                        </div>
                        <div class="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                            <p class="font-bold text-blue-400">🔵 พกพาอาวุธปืนไปในที่สาธารณะ (ม.8 ทวิ)</p>
                            <p class="text-xs text-slate-300 mt-1">ข้อหา: พาอาวุธปืนติดตัวไปในเมือง หมู่บ้าน หรือทางสาธารณะ โดยไม่ได้รับอนุญาตและไม่มีเหตุอันสมควร (ม.8 ทวิ, ม.72 ทวิ)</p>
                        </div>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mt-4">2. ปืนแบลงค์กัน (Blank Gun) / บีบีกันดัดแปลง</h4>
                    <div class="bg-red-500/10 p-3.5 rounded-xl border border-red-500/30 text-xs text-slate-300">
                        หากมีการ <strong>ดัดแปลงลำกล้อง ชุดลั่นไก หรือใส่ลูกกระสุนจริงยิงได้</strong> จะถูกจัดเป็น "อาวุธปืนเถื่อน" ตามคำพิพากษาศาลฎีกา ดำเนินคดีตาม ม.7 และ ม.72 วรรคหนึ่ง ทันที
                    </div>
                `
            },
            {
                id: 'k04',
                title: "แยกแยะฐานความผิด: ลัก-วิ่ง-ชิง-ปล้น-กรรโชก-รีดเอาทรัพย์",
                category: "อาชญากรรม",
                icon: "⚖️",
                description: "การวินิจฉัยองค์ประกอบความผิดเกี่ยวกับทรัพย์ใน ป.อาญา",
                rawText: `การแยกแยะความผิดเกี่ยวกับทรัพย์ (ป.อาญา):
- ลักทรัพย์ (ม.334): เอาทรัพย์ของผู้อื่นไปโดยทุจริต (ไม่มีการขู่เข็ญหรือใช้กำลัง)
- วิ่งราวทรัพย์ (ม.336): ลักทรัพย์โดย "ฉกฉวยเอาซึ่งหน้า" เช่น กระชากสร้อย แย่งกระเป๋า
- ชิงทรัพย์ (ม.339): ลักทรัพย์โดย "ใช้กำลังประทุษร้าย หรือขู่เข็ญว่าจะใช้กำลังทันที"
- ปล้นทรัพย์ (ม.340): ร่วมกันชิงทรัพย์ตั้งแต่ "3 คนขึ้นไป"
- กรรโชกทรัพย์ (ม.337): ข่มขืนใจผู้อื่นให้ยอมให้ทรัพย์ โดย "ขู่ว่าจะทำอันตรายต่อชีวิต ร่างกาย เสรีภาพ ชื่อเสียง หรือทรัพย์สิน"
- รีดเอาทรัพย์ (ม.338): ข่มขืนใจผู้อื่นให้ยอมให้ทรัพย์ โดย "ขู่ว่าจะเปิดเผยความลับ"`,
                content: `
                    <div class="grid sm:grid-cols-2 gap-3 text-xs">
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-blue-400 mb-1">1. ลักทรัพย์ (ม.334)</p>
                            <p class="text-slate-300">แอบเอาทรัพย์ของผู้อื่นไปโดยทุจริต ไม่มีใครเห็น หรือแอบหยิบ</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400 mb-1">2. วิ่งราวทรัพย์ (ม.336)</p>
                            <p class="text-slate-300">ลักทรัพย์โดยกิริยา <strong>ฉกฉวยซึ่งหน้า</strong> เช่น ขี่รถกระชากสร้อย, วิ่งแย่งโทรศัพท์จากมือ</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-red-400 mb-1">3. ชิงทรัพย์ (ม.339)</p>
                            <p class="text-slate-300">ลักทรัพย์ + <strong>ใช้กำลังประทุษร้าย</strong> หรือขู่เข็ญว่าจะทำร้ายในทันที เช่น ชักมีดขู่เอาเงิน, ชกต่อยเพื่อแย่งรถ</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-purple-400 mb-1">4. ปล้นทรัพย์ (ม.340)</p>
                            <p class="text-slate-300">ร่วมกันชิงทรัพย์ตั้งแต่ <strong>3 คนขึ้นไป</strong> (หากมีอาวุธปืน/คนเจ็บ โทษจะหนักขึ้น)</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-emerald-400 mb-1">5. กรรโชกทรัพย์ (ม.337)</p>
                            <p class="text-slate-300">ขู่ว่าจะทำร้าย, พังร้าน หรือข่มขู่เพื่อให้เหยื่อส่งมอบเงินให้ (เช่น มาเฟียคุมซอย)</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-pink-400 mb-1">6. รีดเอาทรัพย์ (ม.338)</p>
                            <p class="text-slate-300">ขู่ว่าจะ <strong>เปิดเผยความลับ</strong> (Blackmail) เช่น คลิปหลุด ภาพลับ แลกกับเงิน</p>
                        </div>
                    </div>
                `
            },
            {
                id: 'k05',
                title: "พ.ร.ก.ปราบอาชญากรรมไซเบอร์ (บัญชีม้า/ซิมม้า)",
                category: "กฎหมายใหม่",
                icon: "💻",
                description: "บทลงโทษบัญชีม้า ซิมม้า และการระงับธุรกรรมธนาคาร 72 ชม.",
                rawText: `พ.ร.ก.มาตรการป้องกันและปราบปรามอาชญากรรมทางเทคโนโลยี พ.ศ. 2566
- เจ้าของบัญชีม้า/ซิมม้า: จำคุกไม่เกิน 3 ปี หรือปรับไม่เกิน 300,000 บาท หรือทั้งจำทั้งปรับ
- ผู้จัดหา/นายหน้า/โฆษณาซื้อขายบัญชี: จำคุก 2-5 ปี หรือปรับ 200,000 - 500,000 บาท
- ผู้เสียหายโทรแจ้งธนาคารระงับธุรกรรมได้ทันที 72 ชม. และแจ้งความผ่าน thaipoliceonline.go.th`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. ฐานความผิดและบทลงโทษ</h4>
                    <div class="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
                        <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                            <p class="font-bold text-red-400 mb-1">🔴 เจ้าของบัญชีม้า / ซิมม้า (ม.9)</p>
                            <p class="text-xs text-slate-300">เปิดให้ผู้อื่นใช้บัญชี/ซิมโดยรู้ว่าจะนำไปใช้ทำผิด</p>
                            <p class="text-xs text-amber-400 mt-2 font-bold">โทษ: คุกไม่เกิน 3 ปี หรือปรับไม่เกิน 3 แสนบาท (หรือทั้งจำทั้งปรับ)</p>
                        </div>
                        <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                            <p class="font-bold text-red-400 mb-1">🔴 นายหน้า / ธุระจัดหา / โฆษณา (ม.10)</p>
                            <p class="text-xs text-slate-300">จัดหา ซื้อ ขาย ให้เช่า บัญชีหรือซิมการ์ด</p>
                            <p class="text-xs text-amber-400 mt-2 font-bold">โทษ: คุก 2 - 5 ปี หรือปรับ 2 แสน - 5 แสนบาท (หรือทั้งจำทั้งปรับ)</p>
                        </div>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mt-4">2. การประสานงานระงับธุรกรรม</h4>
                    <p class="text-sm text-slate-300 mb-2">เมื่อผู้เสียหายแจ้งความ ธนาคารสามารถระงับบัญชีปลายทางไว้ได้ <strong>72 ชั่วโมง</strong> ทันที จากนั้นพนักงานสอบสวนจะส่งหมายอายัดผ่านระบบออนไลน์ AOC 1441</p>
                `
            },
            {
                id: 'k06',
                title: "ประมวลกฎหมายยาเสพติดใหม่ & เกณฑ์ 1 เม็ด",
                category: "ยาเสพติด",
                icon: "💊",
                description: "กฎกระทรวงสาธารณสุข 2567: สันนิษฐานมีไว้เพื่อเสพ และขั้นตอนส่งบำบัด",
                rawText: `กฎหมายยาเสพติดใหม่ (กฎกระทรวง 2567)
- ยาบ้า: ไม่เกิน 1 เม็ด หรือน้ำหนักสุทธิไม่เกิน 100 มก. สันนิษฐานว่ามีไว้ในครอบครองเพื่อเสพ
- ยาไอซ์: น้ำหนักสุทธิไม่เกิน 100 มก.
- หากสมัครใจเข้ารับการบำบัดรักษาและผ่านการบำบัด จะได้รับการยกเว้นโทษทางอาญา
- หากมีพฤติการณ์จำหน่าย เช่น แบ่งซอง ซุกซ่อน ตาชั่ง บัญชีลูกค้า ให้ดำเนินคดีครอบครองเพื่อจำหน่าย`,
                content: `
                    <div class="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl mb-4">
                        <h4 class="font-bold text-amber-400">เกณฑ์สันนิษฐานมีไว้ในครอบครอง "เพื่อเสพ" (กฎกระทรวง 2567)</h4>
                        <p class="text-xs text-slate-300 mt-1">ยาบ้า <strong>ไม่เกิน 1 เม็ด</strong> หรือน้ำหนักสุทธิไม่เกิน 100 มิลลิกรัม</p>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mb-2">ข้อสังเกตพฤติการณ์จำหน่าย (แม้มีเพียง 1 เม็ด)</h4>
                    <ul class="list-disc pl-5 space-y-1 text-sm text-slate-300 mb-4">
                        <li>มีอุปกรณ์ชั่งตวงวัดดิจิทัล</li>
                        <li>มีถุงซิปแบ่งบรรจุขนาดเล็กจำนวนมาก</li>
                        <li>มีโพยบัญชีรายรับ-รายจ่ายลูกค้า หรือแชทซื้อขายยาเสพติด</li>
                        <li>มีการล่อซื้อ หรือตรวจพบเงินล่อซื้อในตัว</li>
                    </ul>

                    <div class="p-3.5 bg-slate-800 rounded-xl border border-slate-700 text-xs text-slate-300">
                        <span class="font-bold text-emerald-400">💡 แนวทางปฏิบัติ:</span> หากเป็นผู้เสพและไม่มีพฤติการณ์จำหน่าย ให้นำตัวส่งศูนย์คัดกรองเพื่อเข้ารับการบำบัดฟื้นฟูตามขั้นตอน
                    </div>
                `
            },
            {
                id: 'k07',
                title: "การตรวจค้นบุคคล และยานพาหนะตาม ป.วิ.อ.",
                category: "ยุทธวิธี",
                icon: "🔍",
                description: "อำนาจค้นตัว ค้นรถยนต์ และการค้นในที่รโหฐานโดยไม่มีหมาย (ม.92)",
                rawText: `อำนาจตรวจค้นตาม ป.วิ.อาญา
- การค้นตัวในที่สาธารณะ (ม.93): ต้องมี "เหตุอันควรสงสัย" ว่ามีสิ่งของผิดกฎหมาย
- การค้นในที่รโหฐานโดยไม่มีหมาย (ม.92):
  1. มีเสียงร้องขอความช่วยเหลือจากข้างใน
  2. มีความผิดซึ่งหน้า และผู้กระทำผิดหนีเข้าไป
  3. มีพยานหลักฐานจะถูกทำลาย/โยกย้ายหากรอหมาย (ต้องเป็นระดับ สว. ขึ้นไป)`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. การค้นตัวในที่สาธารณะ (มาตรา 93)</h4>
                    <p class="text-sm text-slate-300 mb-3">ห้ามมิให้ค้นบุคคลใดในที่สาธารณสถาน เว้นแต่พนักงานฝ่ายปกครองหรือตำรวจ <strong>"มีเหตุอันควรสงสัยว่าบุคคลนั้นมีสิ่งของที่ผิดกฎหมาย หรือได้มาจากการกระทำความผิด"</strong></p>

                    <h4 class="text-base font-bold text-blue-400 mb-2">2. ข้อยกเว้นการค้นที่รโหฐานโดยไม่มีหมาย (มาตรา 92)</h4>
                    <div class="space-y-2 text-sm text-slate-300">
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <strong>1. มีเสียงร้องขอความช่วยเหลือ:</strong> ร้องมาจากภายในเคหสถาน
                        </div>
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <strong>2. ความผิดซึ่งหน้า:</strong> กำลังกระทำผิด และหลบหนีเข้าไปในบ้าน
                        </div>
                        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                            <strong>3. หลักฐานจะถูกทำลาย/โยกย้าย:</strong> หากรอหมายค้นสิ่งของผิดกฎหมายจะสูญหาย (ต้องมีตำรวจยศตั้งแต่ สว. ขึ้นไปเป็นผู้นำค้น)
                        </div>
                    </div>
                `
            },
            {
                id: 'k08',
                title: "การไล่กล้อง CCTV & เทคนิคเทียบเวลา Offset",
                category: "เทคโนโลยี",
                icon: "⏱️",
                description: "หลักการสืบสวนเส้นทางคนร้าย และการคำนวณชดเชยเวลา DVR",
                rawText: `การสืบสวนกล้องวงจรปิด (CCTV Investigation)
1. ตรวจสอบเวลาจริง (Real-time) เทียบกับเวลาหน้าจอเครื่องบันทึก DVR เพื่อหาค่า Offset Time
2. ไล่ 3 ช่วงเวลาสำคัญ:
   - ก่อนเกิดเหตุ (Inbound / Approach Route)
   - ขณะเกิดเหตุ (Crime Scene)
   - หลังเกิดเหตุ (Outbound / Escape Route)
3. เก็บไฟล์วิดีโอแบบ Native / Raw file พร้อมจดบันทึกยี่ห้อ รุ่น และเวลาของเครื่อง`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. การคำนวณเวลา Offset (CCTV Time Sync)</h4>
                    <p class="text-sm text-slate-300 mb-3">เครื่องบันทึกกล้อง (DVR/NVR) มักมีเวลาเดินเร็วหรือช้ากว่าเวลาจริง ให้ถ่ายภาพหน้าจอนาฬิกาข้อมือ/มือถือเทียบกับเวลาบนหน้าจอ DVR ทันทีเพื่อนำมาลบ/บวกชดเชยเวลา</p>

                    <h4 class="text-base font-bold text-blue-400 mb-2">2. หลัก 3 เฟสการไล่เส้นทาง</h4>
                    <div class="grid sm:grid-cols-3 gap-3 text-xs">
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-emerald-400 mb-1">🏁 ขามา (Approach)</p>
                            <p class="text-slate-300">หาจุดเริ่มต้น ที่พัก หรือยานพาหนะที่ใช้เดินทางมา</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400 mb-1">🎯 ที่เกิดเหตุ (Scene)</p>
                            <p class="text-slate-300">ยืนยันพฤติการณ์ ตำหนิรูปพรรณ และอาวุธ</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-red-400 mb-1">🚀 ขาหนี (Escape)</p>
                            <p class="text-slate-300">หาทิศทางหลบหนี จุดเปลี่ยนเสื้อผ้า หรือทิ้งของกลาง</p>
                        </div>
                    </div>
                `
            },
            {
                id: 'k09',
                title: "การสืบสวนแกะรอยเส้นทางการเงิน (Money Trail)",
                category: "เทคโนโลยี",
                icon: "💳",
                description: "การไล่ผังบัญชีม้า แถว 1-3, การแปลงสินทรัพย์คริปโต และจุดกดเงิน ATM",
                rawText: `การสืบสวนเส้นทางการเงิน (Financial Investigation)
1. บัญชีม้าแถว 1: รับเงินโอนจากเหยื่อโดยตรง (มักโอนต่อภายใน 1-3 นาที)
2. บัญชีม้าแถว 2-3: กระจายเงิน ซอยยอดเงินเพื่อหลบระบบตรวจจับ AMLO
3. ปลายทาง: แปลงเป็นคริปโต (USDT ผ่าน P2P) หรือกดเงินสดตู้ ATM ตามแนวชายแดน
4. พยานหลักฐานที่ต้องขอ: Statement, IP Login, พิกัดตู้ ATM, ภาพวงจรปิดหน้าตู้`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. ผังการเคลื่อนย้ายเงินของแก๊งคอลเซ็นเตอร์ / สแกมเมอร์</h4>
                    <div class="space-y-2 text-xs text-slate-300 mb-4">
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-emerald-400">เหยื่อโอนเงิน ➡️ บัญชีแถวที่ 1 (รับตรง)</p>
                            <p class="text-slate-400 mt-0.5">เงินจะอยู่ไม่เกิน 1-3 นาที ก่อนบอทโอนกระจาย</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400">➡️ บัญชีแถวที่ 2 และ 3 (กระจายยอด)</p>
                            <p class="text-slate-400 mt-0.5">ซอยย่อยยอดเงินเป็น 49,000 บาท หรือซื้อสินค้า/ทองคำ</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-red-400">➡️ กดเงินสด ATM / ซื้อเหรียญคริปโต (USDT)</p>
                            <p class="text-slate-400 mt-0.5">ใช้ม้ากดเงินสดหน้าตู้ ATM หรือโอนเข้า Binance/Bitkub ซื้อเหรียญส่งออกนอกประเทศ</p>
                        </div>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mb-2">2. หลักฐานสำคัญที่ต้องประสานธนาคาร</h4>
                    <ul class="list-disc pl-5 space-y-1 text-xs text-slate-300">
                        <li><strong>Bank Statement แบบ Real-time:</strong> พร้อมระบุเลขบัญชีปลายทางและธนาคาร</li>
                        <li><strong>IP Address & User Agent:</strong> ที่ใช้ Login เข้า Mobile Banking</li>
                        <li><strong>CCTV หน้าตู้ ATM:</strong> พิกัดตู้, วันเวลาที่กดเงิน เพื่อพิสูจน์ทราบตัวคนกดเงิน</li>
                    </ul>
                `
            },
            {
                id: 'k10',
                title: "การยึดวัตถุพยานดิจิทัล (มือถือ & คอมพิวเตอร์)",
                category: "นิติวิทยาศาสตร์",
                icon: "📱",
                description: "วิธีป้องกันการลบข้อมูลระยะไกล (Remote Wipe) และการแพ็กเกจ",
                rawText: `ขั้นตอนการยึดของกลางดิจิทัล (Digital Evidence)
1. โทรศัพท์เปิดเครื่องอยู่: เปิดโหมดเครื่องบิน (Airplane Mode) ทันที ห้ามกดปิดเครื่องเด็ดขาด เพื่อป้องกันการล็อค Passcode
2. ใส่ในซองป้องกันคลื่นสัญญาณ (Faraday Bag) หรือห่อด้วยกระดาษฟอยล์หนา 3-4 ชั้น
3. ห้ามแตะต้องเปิดดูแชทหรือไฟล์เพื่อป้องกันการแก้ไข Metadata`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">ข้อควรระวังในการยึดโทรศัพท์มือถือ</h4>
                    <div class="space-y-3 text-sm text-slate-300">
                        <div class="p-3.5 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400 mb-1">1. เครื่องเปิดอยู่และปลดล็อคอยู่:</p>
                            <p>เปิด <strong>โหมดเครื่องบิน (Airplane Mode)</strong> ทันที และปรับการพักหน้าจอเป็น "ไม่ปิดหน้าจอ (Never Sleep)" เพื่อให้สามารถดึงข้อมูลได้</p>
                        </div>
                        <div class="p-3.5 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400 mb-1">2. ป้องกันการล้างเครื่องระยะไกล (Remote Wipe):</p>
                            <p>คนร้ายอาจใช้ Find My iPhone / Google Find My Device สั่งล้างเครื่อง ให้บรรจุโทรศัพท์ใน <strong>ซองฟอยล์ Faraday</strong> หรือถอดซิมการ์ดออก</p>
                        </div>
                        <div class="p-3.5 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400 mb-1">3. บันทึก Chain of Custody:</p>
                            <p>ถ่ายภาพหน้าจอตัวเครื่อง ซีลถุงพยานวัตถุพร้อมเซ็นชื่อกำกับ</p>
                        </div>
                    </div>
                `
            },
            {
                id: 'k11',
                title: "การเก็บ DNA & ลายนิ้วมือแฝงในที่เกิดเหตุ",
                category: "นิติวิทยาศาสตร์",
                icon: "🔬",
                description: "เทคนิคการรักษาพยานหลักฐานทางชีววิทยา และ Chain of Custody",
                rawText: `การเก็บ DNA และลายนิ้วมือแฝง
- ลายนิ้วมือแฝง (Latent Prints): พบตามพื้นผิวเรียบ กระจก ที่เปิดประตู ด้ามปืน ห้ามใช้มือเปล่าแตะเด็ดขาด
- DNA (Touch DNA / เลือด / น้ำลาย): เก็บปลายก้นบุหรี่, หลอดดูดน้ำ, คราบเหงื่อบนเสื้อผ้า
- บรรจุภัณฑ์: วัตถุพยานชีววิทยาที่ชื้น ต้องผึ่งให้แห้งในที่ร่ม แล้วบรรจุใน "ซองกระดาษ" ห้ามใส่ถุงพลาสติกปิดสนิทเพราะจะเกิดเชื้อราทำลาย DNA`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. จุดสำคัญที่มักพบ Touch DNA</h4>
                    <div class="grid sm:grid-cols-3 gap-2.5 text-xs text-slate-300 mb-4">
                        <div class="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400">🔫 อาวุธปืน/มีด</p>
                            <p>ด้ามปืน, โกร่งไก, สไลด์, ด้ามมีด</p>
                        </div>
                        <div class="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400">🚗 ยานพาหนะ</p>
                            <p>พวงมาลัย, หัวเกียร์, ที่เปิดประตูด้านใน</p>
                        </div>
                        <div class="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-amber-400">🥤 ของใช้คนร้าย</p>
                            <p>ขวดน้ำ, ปลายก้นบุหรี่, หน้ากากอนามัย</p>
                        </div>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mb-2">2. กฎเหล็กการแพ็คเกจพยานหลักฐาน</h4>
                    <div class="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30 text-xs text-slate-300 space-y-1">
                        <p>⚠️ <strong>ห้ามใส่ถุงพลาสติกปิดทึบเมื่อวัตถุพยานมีความชื้น:</strong> ความชื้นจะเร่งการเกิดเชื้อราและทำลายสาย DNA ภายใน 24-48 ชม. ให้ใช้ซองกระดาษหรือกล่องกระดาษระบายอากาศ</p>
                    </div>
                `
            },
            {
                id: 'k12',
                title: "คนต่างด้าว วีซ่า และอาชีพสงวน 27 ชนิด",
                category: "คนต่างด้าว",
                icon: "🛂",
                description: "Overstay, รายงานตัว 90 วัน (ม.37), แจ้งที่พัก (ม.38) และอาชีพห้ามต่างด้าวทำ",
                rawText: `กฎหมายคนเข้าเมือง & การทำงานของคนต่างด้าว
- Overstay: อยู่เกินกำหนด ปรับวันละ 500 บาท สูงสุดไม่เกิน 20,000 บาท และขึ้น Blacklist ห้ามเข้าประเทศ
- ม.38 พ.ร.บ.คนเข้าเมือง: เจ้าบ้าน/โรงแรม ต้องแจ้งต่างด้าวเข้าพักภายใน 24 ชม.
- อาชีพห้ามต่างด้าวทำเด็ดขาด: เร่ขายสินค้า, ตัดผม/เสริมสวย, ขับขี่รถรับจ้าง, นวดแผนไทย, มัคคุเทศก์, รปภ.`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">1. อาชีพที่คนต่างด้าวห้ามทำเด็ดขาด (พบบ่อย)</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300 mb-4">
                        <div class="p-2.5 bg-slate-800 rounded-lg border border-slate-700 font-medium">❌ เร่ขายของ / ขายลูกชิ้น</div>
                        <div class="p-2.5 bg-slate-800 rounded-lg border border-slate-700 font-medium">❌ ขับวินมอเตอร์ไซค์ / แท็กซี่</div>
                        <div class="p-2.5 bg-slate-800 rounded-lg border border-slate-700 font-medium">❌ ตัดผม / ดัดผม / เสริมสวย</div>
                        <div class="p-2.5 bg-slate-800 rounded-lg border border-slate-700 font-medium">❌ นวดแผนไทย</div>
                        <div class="p-2.5 bg-slate-800 rounded-lg border border-slate-700 font-medium">❌ มัคคุเทศก์ / นำเที่ยว</div>
                        <div class="p-2.5 bg-slate-800 rounded-lg border border-slate-700 font-medium">❌ พนักงานรักษาความปลอดภัย</div>
                    </div>

                    <h4 class="text-base font-bold text-blue-400 mb-2">2. พ.ร.บ.คนเข้าเมือง มาตรา 38 (แจ้งที่พัก)</h4>
                    <p class="text-sm text-slate-300">เจ้าบ้าน เจ้าของ หรือผู้จัดการโรงแรม ต้องแจ้งต่อพนักงานเจ้าหน้าที่ตรวจคนเข้าเมืองภายใน <strong>24 ชั่วโมง</strong> นับแต่คนต่างด้าวเข้าพักอาศัย (หากฝ่าฝืนมีโทษปรับ)</p>
                `
            },
            {
                id: 'k13',
                title: "การปฐมพยาบาลทางยุทธวิธี (TCCC / Tactical Medicine)",
                category: "ยุทธวิธี",
                icon: "⚕️",
                description: "การใช้สายรัดห้ามเลือด (Tourniquet), แปะ Chest Seal และหลัก MARCH",
                rawText: `การปฐมพยาบาลทางยุทธวิธี (TCCC)
- Care Under Fire: ยิงกดดันเข้าที่กำบัง รัดสาย Tourniquet เหนือแผลเลือดออกรุนแรงทันที
- Tactical Field Care (หลัก MARCH):
  M: Massive Hemorrhage (ห้ามเลือดฉุกเฉิน)
  A: Airway (เปิดทางเดินหายใจ)
  R: Respiration (แปะ Chest Seal แผลถูกยิงที่อก)
  C: Circulation (ตรวจชีพจร ป้องกันภาวะช็อก)
  H: Hypothermia (ห่มผ้าป้องกันอุณหภูมิกายลด)`,
                content: `
                    <h4 class="text-base font-bold text-blue-400 mb-2">ลำดับการปฏิบัติเมื่อมีเจ้าหน้าที่หรือเหยื่อถูกยิง</h4>
                    <div class="space-y-2.5 text-xs text-slate-300">
                        <div class="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                            <p class="font-bold text-red-400">1. เลือดพุ่งรุนแรง (Massive Bleeding)</p>
                            <p>ใช้สายรัด Tourniquet รัดเหนือแผล 2-3 นิ้ว (หรือรัดต้นแขน/ต้นขาสูงสุด) ขันด้ามจนเลือดหยุดไหล จดเวลาที่รัดไว้ที่หน้าผาก/สายรัด</p>
                        </div>
                        <div class="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                            <p class="font-bold text-blue-400">2. แผลถูกยิงที่หน้าอก/แผ่นหลัง (Gunshot Wound)</p>
                            <p>แปะ <strong>Vented Chest Seal</strong> ปิดแผลเพื่อไม่ให้ลมดูดเข้าช่องอก หากไม่มีใช้วัสดุพลาสติกใสแปะเทป 3 ด้าน</p>
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <p class="font-bold text-emerald-400">3. ป้องกันภาวะช็อก</p>
                            <p>ห่มผ้าฟอยล์อุ่น ยกขาสูง และรีบลำเลียงส่งโรงพยาบาลที่ใกล้ที่สุดทันที</p>
                        </div>
                    </div>
                `
            },
            {
                id: 'k14',
                title: "ขั้นตอนการสืบสวนจับกุมเด็กและเยาวชน",
                category: "กฎหมายใหม่",
                icon: "👶",
                description: "พ.ร.บ.ศาลเยาวชนฯ: การไม่ใส่กุญแจมือ และการนำส่งศาลภายใน 24 ชม.",
                rawText: `พ.ร.บ.ศาลเยาวชนและครอบครัวและวิธีพิจารณาคดีเยาวชนและครอบครัว พ.ศ. 2553
- เด็ก: อายุไม่เกิน 15 ปี (ไม่ต้องรับโทษทางอาญา แต่ศาลอาจกำหนดมาตรการ)
- เยาวชน: อายุเกิน 15 ปีแต่ไม่เกิน 18 ปี
- ข้อห้ามสำคัญ:
  1. ห้ามใส่เครื่องพันธนาการ (กุญแจมือ) เว้นแต่มีพฤติการณ์หลบหนีหรือใช้ความรุนแรง
  2. ต้องแจ้งบิดามารดา/ผู้ปกครอง และสถานพินิจฯ ทราบทันที
  3. ต้องนำตัวส่งศาลเยาวชนเพื่อตรวจสอบการจับภายใน 24 ชั่วโมง
  4. การสอบปากคำต้องมี สหวิชาชีพ (นักจิตวิทยา/นักสังคมสงเคราะห์/อัยการ/ทนาย) เข้าร่วม`,
                content: `
                    <div class="bg-indigo-500/10 border-l-4 border-indigo-500 p-4 rounded-xl mb-4 text-xs text-slate-300">
                        <p class="font-bold text-indigo-400 text-sm mb-1">กฎเหล็กคดีเด็กและเยาวชน (อายุไม่เกิน 18 ปี)</p>
                        <p>ต้องปฏิบัติตาม พ.ร.บ.ศาลเยาวชนฯ อย่างเคร่งครัด มิฉะนั้นพนักงานสอบสวนอาจถูกสั่งปล่อยตัวและผิดวินัย</p>
                    </div>

                    <div class="space-y-2 text-xs text-slate-300">
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">1. การใส่กุญแจมือ:</span> <strong>ห้ามใส่</strong> เว้นแต่เด็กมีอาวุธ มีอาการคุ้มคลั่ง หรือจะทำร้ายผู้อื่น
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">2. กำหนดเวลา 24 ชม.:</span> ต้องนำตัวไปศาลเยาวชนและครอบครัวเพื่อตรวจสอบการจับกุมภายใน 24 ชั่วโมง
                        </div>
                        <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                            <span class="font-bold text-amber-400">3. การซักถาม/สอบปากคำ:</span> ต้องมีสหวิชาชีพ, พนักงานอัยการ, ทนายความ และผู้ปกครอง ร่วมอยู่ด้วยเสมอ
                        </div>
                    </div>
                `
            }
        ];
        // ========================================
        // APPLICATION STATE & ENHANCEMENTS
        // ========================================
        let currentActiveItem = null;
        let currentCategory = 'all';
        let currentFontSize = 'md';
        let ttsUtterance = null;
        let isTtsPlaying = false;

        // Favorites stored in LocalStorage
        function getFavorites() {
            try {
                return JSON.parse(localStorage.getItem('san_kb_favorites') || '[]');
            } catch(e) {
                return [];
            }
        }

        function saveFavorites(favs) {
            try {
                localStorage.setItem('san_kb_favorites', JSON.stringify(favs));
            } catch(e) {}
            updateFavoriteCount();
        }

        function isFavorite(id) {
            return getFavorites().includes(id);
        }

        function toggleFavorite(id, e) {
            if (e) e.stopPropagation();
            let favs = getFavorites();
            if (favs.includes(id)) {
                favs = favs.filter(f => f !== id);
                showToast('นำออกจากรายการโปรดแล้ว', 'info');
            } else {
                favs.push(id);
                showToast('บันทึกลงรายการโปรดแล้ว ⭐', 'success');
            }
            saveFavorites(favs);
            
            // Re-render if we are in favorites view, or update cards
            if (currentCategory === 'favorites') {
                filterCategory('favorites');
            } else {
                renderCards(getCurrentlyFilteredList());
            }

            // Update modal star if open
            if (currentActiveItem && currentActiveItem.id === id) {
                updateModalStar(id);
            }
        }

        function toggleFavoriteFromModal() {
            if (!currentActiveItem) return;
            toggleFavorite(currentActiveItem.id);
        }

        function updateModalStar(id) {
            const btn = document.getElementById('modalFavBtn');
            if (!btn) return;
            if (isFavorite(id)) {
                btn.innerHTML = '<i class="fa-solid fa-star text-amber-400"></i>';
                btn.classList.add('bg-amber-500/20');
            } else {
                btn.innerHTML = '<i class="fa-regular fa-star text-slate-400"></i>';
                btn.classList.remove('bg-amber-500/20');
            }
        }

        function updateFavoriteCount() {
            const favs = getFavorites();
            const count = favs.length;
            const badge = document.getElementById('favCountBadge');
            const catBadge = document.getElementById('count-fav');
            if (badge) badge.textContent = count;
            if (catBadge) catBadge.textContent = count;
        }

        // ========================================
        // RENDER CARDS (CRISP CONTRAST & QUICK COPY)
        // ========================================
        function renderCards(data) {
            const grid = document.getElementById('knowledgeGrid');
            const count = document.getElementById('resultCount');
            if (count) count.textContent = data.length;

            if (data.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-16 px-4">
                        <div class="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-center mx-auto text-3xl text-police-blue dark:text-slate-400 mb-3 shadow-inner">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h4 class="font-bold text-police-blue dark:text-slate-200 text-base">ไม่พบข้อมูลความรู้ที่ตรงกับคำค้นหา</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูครับ</p>
                        <button onclick="clearSearch()" class="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold transition shadow-md cursor-pointer">
                            ล้างคำค้นหา
                        </button>
                    </div>
                `;
                return;
            }

            const favs = getFavorites();
            const searchTerm = (document.getElementById('searchInput')?.value || '').trim();

            grid.innerHTML = data.map(item => {
                const fav = favs.includes(item.id);
                
                // Highlight search term if present
                const displayTitle = highlightText(item.title, searchTerm);
                const displayDesc = highlightText(item.description, searchTerm);

                return `
                <div onclick="openModal('${item.id}')" class="glass-card rounded-2xl p-5 cursor-pointer relative overflow-hidden group flex flex-col justify-between">
                    
                    <!-- Top row: Icon, Category Badge & Favorite Star -->
                    <div>
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-900 text-white flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-md flex-shrink-0">
                                    ${item.icon}
                                </div>
                                <div>
                                    <span class="badge-cat px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-police-blue dark:text-blue-400 border border-blue-200 dark:border-blue-500/25">
                                        ${item.category}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Star Favorite Button -->
                            <button onclick="toggleFavorite('${item.id}', event)" class="star-fav w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center transition cursor-pointer" title="${fav ? 'ลบออกจากรายการโปรด' : 'ปักหมุดรายการโปรด'}">
                                <i class="${fav ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star text-slate-400'}"></i>
                            </button>
                        </div>

                        <!-- Title: Crisp Police Blue & High Contrast -->
                        <h3 class="card-title font-black text-police-blue dark:text-white text-base mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            ${displayTitle}
                        </h3>

                        <!-- Description -->
                        <p class="card-desc text-slate-600 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed mb-4 font-medium">
                            ${displayDesc}
                        </p>
                    </div>

                    <!-- Bottom Action Bar: Quick Copy + Read Full -->
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2 text-xs font-semibold">
                        <!-- Quick Copy Button -->
                        <button onclick="quickCopyRawText('${item.id}', event)" class="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-police-blue dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 border border-blue-200 dark:border-slate-700 flex items-center gap-1.5 transition font-bold cursor-pointer" title="คัดลอกสรุปนำไปใช้งานได้ทันที">
                            <i class="fa-regular fa-copy text-blue-600 dark:text-blue-400"></i>
                            <span>คัดลอกด่วน</span>
                        </button>

                        <!-- Read Full Indicator -->
                        <div class="text-police-blue dark:text-blue-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                            <span>อ่านฉบับเต็ม</span>
                            <i class="fa-solid fa-arrow-right text-[10px]"></i>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

        function highlightText(text, query) {
            if (!query || query.length < 2) return text;
            try {
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escaped})`, 'gi');
                return text.replace(regex, '<mark class="search-highlight">$1</mark>');
            } catch(e) {
                return text;
            }
        }

        // ========================================
        // MODAL OPERATIONS & ENHANCEMENTS
        // ========================================
        function openModal(id) {
            const item = knowledgeData.find(i => i.id === id);
            if (item) {
                currentActiveItem = item;
                document.getElementById('modalTitle').textContent = item.title;
                document.getElementById('modalCategory').textContent = item.category;
                document.getElementById('modalIcon').textContent = item.icon;
                const idBadge = document.getElementById('modalIdBadge');
                if (idBadge) idBadge.textContent = '#' + item.id;

                // Inject enriched content with auto copy buttons for code/template blocks
                const modalBody = document.getElementById('modalBody');
                modalBody.innerHTML = item.content;
                modalBody.className = `p-6 text-slate-300 leading-relaxed space-y-4 font-normal text-${currentFontSize}`;

                // Add inline copy buttons to all template/select-all boxes
                enhanceModalTemplateBlocks();

                updateModalStar(item.id);

                const modal = document.getElementById('knowledgeModal');
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Reset TTS state
                stopTts();
            }
        }

        function closeModal() {
            const modal = document.getElementById('knowledgeModal');
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            currentActiveItem = null;
            stopTts();
        }

        function enhanceModalTemplateBlocks() {
            const modalBody = document.getElementById('modalBody');
            if (!modalBody) return;

            // Find blocks with .select-all or mono fonts
            const codeBlocks = modalBody.querySelectorAll('.select-all, .font-mono');
            codeBlocks.forEach(block => {
                if (block.querySelector('.inline-copy-btn')) return;
                
                block.style.position = 'relative';
                const copyBtn = document.createElement('button');
                copyBtn.className = 'inline-copy-btn absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold transition flex items-center gap-1 border border-slate-600 shadow';
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>คัดลอกบล็อกนี้</span>';
                copyBtn.onclick = (e) => {
                    e.stopPropagation();
                    const text = block.innerText.replace('คัดลอกบล็อกนี้', '').trim();
                    navigator.clipboard.writeText(text).then(() => {
                        showToast('คัดลอกเทมเพลตเรียบร้อย', 'success');
                    });
                };
                block.appendChild(copyBtn);
            });
        }

        // Font Resizer for Modal
        function changeFontSize(size) {
            currentFontSize = size;
            const modalBody = document.getElementById('modalBody');
            if (!modalBody) return;
            modalBody.classList.remove('text-xs', 'text-sm', 'text-base', 'text-lg');
            if (size === 'sm') modalBody.classList.add('text-xs');
            else if (size === 'md') modalBody.classList.add('text-sm');
            else if (size === 'lg') modalBody.classList.add('text-base');
        }

        // ========================================
        // TEXT-TO-SPEECH (TTS) VOICE READER
        // ========================================
        function toggleTtsReader() {
            if (!currentActiveItem) return;

            if (isTtsPlaying) {
                stopTts();
                return;
            }

            if (!('speechSynthesis' in window)) {
                showToast('เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง', 'warning');
                return;
            }

            window.speechSynthesis.cancel();

            const rawTextToRead = `${currentActiveItem.title}. ${currentActiveItem.rawText || currentActiveItem.description}`;
            ttsUtterance = new SpeechSynthesisUtterance(rawTextToRead);
            ttsUtterance.lang = 'th-TH';
            ttsUtterance.rate = 1.0;

            // Attempt to pick a Thai voice if available
            const voices = window.speechSynthesis.getVoices();
            const thaiVoice = voices.find(v => v.lang.includes('th') || v.name.includes('Thai'));
            if (thaiVoice) ttsUtterance.voice = thaiVoice;

            ttsUtterance.onstart = () => {
                isTtsPlaying = true;
                const icon = document.getElementById('ttsIcon');
                const label = document.getElementById('ttsLabel');
                if (icon) icon.className = 'fa-solid fa-stop text-red-400 animate-pulse';
                if (label) label.textContent = '⏹️ หยุดอ่าน';
            };

            ttsUtterance.onend = () => {
                stopTts();
            };

            ttsUtterance.onerror = () => {
                stopTts();
            };

            window.speechSynthesis.speak(ttsUtterance);
        }

        function stopTts() {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            isTtsPlaying = false;
            const icon = document.getElementById('ttsIcon');
            const label = document.getElementById('ttsLabel');
            if (icon) icon.className = 'fa-solid fa-volume-high';
            if (label) label.textContent = '🔊 อ่านให้ฟัง';
        }

        // ========================================
        // COPY & SHARE HELPERS
        // ========================================
        function quickCopyRawText(id, e) {
            if (e) e.stopPropagation();
            const item = knowledgeData.find(i => i.id === id);
            if (!item) return;

            const textToCopy = `[SOP สืบสวน] ${item.title}\n\n${item.rawText || item.description}\n\n(ที่มา: คลังความรู้ตำรวจสืบสวน San BOT)`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`คัดลอกสรุป "${item.title}" แล้ว`, 'success');
            }).catch(() => {
                fallbackCopy(textToCopy);
            });
        }

        function copyModalContent() {
            if (!currentActiveItem) return;
            const textToCopy = `[SOP สืบสวน] ${currentActiveItem.title}\n\n${currentActiveItem.rawText || currentActiveItem.description}\n\n(ที่มา: คลังความรู้ตำรวจสืบสวน San BOT)`;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const isDark = document.documentElement.classList.contains('dark');
                Swal.fire({
                    icon: 'success',
                    title: 'คัดลอกข้อความสำเร็จ',
                    text: 'สามารถนำไปวางใน LINE กลุ่มงานหรือบันทึกประจำวันได้ทันที',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2500,
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#1e3a8a'
                });
            }).catch(() => {
                fallbackCopy(textToCopy);
            });
        }

        function shareToLine() {
            if (!currentActiveItem) return;
            const textToShare = `[SOP สืบสวน] ${currentActiveItem.title}\n\n${currentActiveItem.rawText || currentActiveItem.description}\n\n(คลังความรู้ San BOT)`;
            const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(textToShare)}`;
            window.open(lineUrl, '_blank');
        }

        function fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('คัดลอกข้อความสำเร็จ', 'success');
        }

        function showToast(msg, icon = 'info') {
            const isDark = document.documentElement.classList.contains('dark');
            Swal.fire({
                icon: icon,
                title: msg,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#ffffff' : '#1e3a8a'
            });
        }

        // ========================================
        // SEARCH & FILTER HANDLING
        // ========================================
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        searchInput.addEventListener('input', () => {
            const term = searchInput.value.trim();
            if (term.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
            renderCards(getCurrentlyFilteredList());
        });

        function clearSearch() {
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            renderCards(getCurrentlyFilteredList());
        }

        function setSearchTerm(term) {
            searchInput.value = term;
            clearSearchBtn.classList.remove('hidden');
            renderCards(getCurrentlyFilteredList());
            searchInput.focus();
        }

        function getCurrentlyFilteredList() {
            const term = (searchInput.value || '').toLowerCase().trim();
            let baseList = knowledgeData;

            // Apply category filter
            if (currentCategory === 'favorites') {
                const favs = getFavorites();
                baseList = knowledgeData.filter(i => favs.includes(i.id));
            } else if (currentCategory !== 'all') {
                baseList = knowledgeData.filter(i => i.category === currentCategory);
            }

            // Apply search term
            if (term.length > 0) {
                baseList = baseList.filter(i =>
                    i.title.toLowerCase().includes(term) ||
                    i.category.toLowerCase().includes(term) ||
                    i.description.toLowerCase().includes(term) ||
                    (i.rawText && i.rawText.toLowerCase().includes(term))
                );
            }

            return baseList;
        }

        function filterCategory(cat) {
            currentCategory = cat;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

            const activeBtn = document.getElementById('cat-' + cat);
            if (activeBtn) activeBtn.classList.add('active');

            renderCards(getCurrentlyFilteredList());
        }

        // ========================================
        // THEME MANAGEMENT (DARK / LIGHT TOGGLE)
        // ========================================
        function initTheme() {
            const savedTheme = localStorage.getItem('san_kb_theme') || 'light';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
                updateThemeUI(true);
            } else {
                document.documentElement.classList.remove('dark');
                updateThemeUI(false);
            }
        }

        function toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('san_kb_theme', isDark ? 'dark' : 'light');
            updateThemeUI(isDark);
            renderCards(getCurrentlyFilteredList());
        }

        function updateThemeUI(isDark) {
            const icon = document.getElementById('themeIcon');
            const label = document.getElementById('themeLabel');
            if (icon) icon.textContent = isDark ? '☀️' : '🌙';
            if (label) label.textContent = isDark ? 'สว่าง' : 'มืด';
        }

        // Close modal on escape or background click
        window.onclick = (e) => {
            if (e.target.id === 'knowledgeModal') closeModal();
        };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('knowledgeModal').classList.contains('active')) {
                closeModal();
            }
        });

        // Initialize App
        initTheme();
        updateFavoriteCount();
        renderCards(knowledgeData);