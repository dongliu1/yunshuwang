<?php
/**
 * Created by PhpStorm.
 * User: liudong
 * Date: 2016/11/17
 * Time: 10:47
 */
if(!empty($_POST)){
    $account=$_POST["account"];
    $password=$_POST["password"];
    $nickname=$_POST["nickname"];
    $usertype=$_POST["usertype"];
    $con =new mysqli("localhost","root","dqTKqNta2dJTF7EU","db_ysw");
    if ($con->connect_error) {
        die("连接失败: " . $con->connect_error);
    }
    if ($result = $con->query("SHOW TABLES LIKE 'ysw_account'")) {

    }else{
        $sql = "CREATE TABLE ysw_account (
                account VARCHAR(40) NOT NULL default '' PRIMARY KEY, 
                password VARCHAR(40) NOT NULL,
                nickname VARCHAR(40) NOT NULL,
                usertype INT(11) NOT NULL
            )DEFAULT CHARSET=utf8";
        $con->query($sql);
    }

    $sql = "INSERT INTO ysw_account(account, password, nickname,usertype) VALUES ('".$account."','".$password."','".$nickname."',".$usertype.")";

    if ($con->query($sql) === TRUE) {
        echo "True";
    } else {
        echo "注册失败";
    }
    $con->close();
}else{
    echo "注册失败";
}
?>