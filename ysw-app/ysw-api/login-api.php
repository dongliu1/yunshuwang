<?php
/**
 * Created by PhpStorm.
 * User: liudong
 * Date: 2016/11/15
 * Time: 14:40
 */
if(!empty($_POST)){
    $account=$_POST["account"];
    $password=$_POST["password"];
    $link=new mysqli("localhost","root","dqTKqNta2dJTF7EU","db_ysw");
    if ($link->connect_error) {
        die("连接失败: " . $link->connect_error);
    }

    $sql = "SELECT * FROM ysw_account where account='".$account."'";
    $result = $link->query($sql);
    $reJson="";
    if ($result->num_rows > 0) {
        // 输出每行数据
        while($row = $result->fetch_assoc()) {
            if($password==$row["password"]){
                $nickname=$row["nickname"];
                $reJson=$reJson.'{"account":"'.$account.'","nickname":"'.$nickname.'","usertype":'.$row["usertype"].',"success":true}';
                echo $reJson;
            }else{
                $reJson=$reJson.'{"error":"密码错误"}';
                echo $reJson;
            }
        }
    } else {
        $reJson=$reJson.'{"error":"账号不存在，请先注册"}';
        echo $reJson;
    }
    $link->close();
}else{
    $reJson=$reJson.'{"error":"无法接收到参数"}';
    echo $reJson;
}
?>